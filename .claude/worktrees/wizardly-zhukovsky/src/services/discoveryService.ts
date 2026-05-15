import { supabase } from '../../lib/supabase';
import { WorkIntent, DiscoveryCard, WorkStyle, LocationType, Profile } from '../types';
import { calculateDistance } from '../hooks/useLocation';

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Fetch user's work intent for today
export async function getTodayIntent(userId: string): Promise<WorkIntent | null> {
  const { data, error } = await supabase
    .from('work_intents')
    .select('*')
    .eq('user_id', userId)
    .eq('intent_date', getTodayDate())
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching intent:', error);
  }

  return data;
}

// Create or update today's work intent
export type IntentInput = {
  task_description: string;
  available_from: string;
  available_until: string;
  work_style: WorkStyle;
  location_type: LocationType;
  location_name?: string | null;
  latitude: number;
  longitude: number;
};

export async function upsertIntent(
  userId: string,
  intentData: IntentInput
): Promise<{ data: WorkIntent | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('work_intents')
    .upsert(
      {
        user_id: userId,
        intent_date: getTodayDate(),
        ...intentData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,intent_date',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting intent:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

// Fetch discovery cards (nearby users with intents for today)
export async function fetchDiscoveryCards(
  userId: string,
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 50
): Promise<DiscoveryCard[]> {
  // Fetch all intents for today, excluding the current user
  const { data: intents, error } = await supabase
    .from('work_intents')
    .select(`
      *,
      profiles:user_id (*)
    `)
    .eq('intent_date', getTodayDate())
    .neq('user_id', userId);

  if (error) {
    console.error('Error fetching discovery cards:', error);
    return [];
  }

  if (!intents) return [];

  // Get users already swiped today
  const { data: swipes } = await supabase
    .from('swipes')
    .select('swiped_id')
    .eq('swiper_id', userId)
    .eq('swipe_date', getTodayDate());

  const swipedIds = new Set((swipes || []).map(s => s.swiped_id));

  // Filter by distance and exclude already swiped users
  const cards: DiscoveryCard[] = [];

  for (const intent of intents) {
    // Skip if already swiped
    if (swipedIds.has(intent.user_id)) continue;

    // Calculate distance
    const distance = calculateDistance(
      latitude,
      longitude,
      intent.latitude,
      intent.longitude
    );

    // Skip if too far
    if (distance > maxDistanceKm) continue;

    // Skip if no profile
    if (!intent.profiles) continue;

    cards.push({
      profile: intent.profiles,
      intent: {
        id: intent.id,
        user_id: intent.user_id,
        task_description: intent.task_description,
        available_from: intent.available_from,
        available_until: intent.available_until,
        work_style: intent.work_style,
        location_type: intent.location_type,
        location_name: intent.location_name,
        latitude: intent.latitude,
        longitude: intent.longitude,
        intent_date: intent.intent_date,
        created_at: intent.created_at,
        updated_at: intent.updated_at,
      },
      distance,
    });
  }

  // Sort by distance
  cards.sort((a, b) => a.distance - b.distance);

  return cards;
}

// Record a swipe and check for match
export async function recordSwipe(
  swiperId: string,
  swipedId: string,
  direction: 'right' | 'left'
): Promise<{
  isMatch: boolean;
  matchId: string | null;
  matchedUser: Profile | null;
  error: Error | null;
}> {
  // Insert the swipe
  const { error: swipeError } = await supabase
    .from('swipes')
    .insert({
      swiper_id: swiperId,
      swiped_id: swipedId,
      direction,
      swipe_date: getTodayDate(),
    });

  if (swipeError) {
    const isDuplicate = swipeError.code === '23505';
    if (!isDuplicate) {
      console.error('Error recording swipe:', swipeError);
      return { isMatch: false, matchId: null, matchedUser: null, error: new Error(swipeError.message) };
    }
  }

  // If it's a left swipe, no need to check for match
  if (direction === 'left') {
    return { isMatch: false, matchId: null, matchedUser: null, error: null };
  }

  // Check if it's a match (other person also swiped right on us today)
  const { data: isMatch, error: matchError } = await supabase
    .rpc('check_match', {
      p_swiper_id: swiperId,
      p_swiped_id: swipedId,
    });

  if (matchError) {
    console.error('Error checking match:', matchError);
    // Don't return error - swipe was recorded successfully
    return { isMatch: false, matchId: null, matchedUser: null, error: null };
  }

  if (!isMatch) {
    return { isMatch: false, matchId: null, matchedUser: null, error: null };
  }

  const { data: matchId, error: createError } = await supabase.rpc('create_match', {
    p_user1: swiperId,
    p_user2: swipedId,
  });

  if (createError) {
    console.error('Error creating match:', createError);
    return { isMatch: true, matchId: null, matchedUser: null, error: null };
  }

  const { data: matchedUser, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', swipedId)
    .single();

  if (profileError) {
    console.error('Error fetching matched user profile:', profileError);
  }

  return { isMatch: true, matchId: matchId || null, matchedUser: matchedUser || null, error: null };
}

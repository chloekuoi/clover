import { supabase } from '../../lib/supabase';
import { WorkIntent, DiscoveryCard, WorkStyle, LocationType, Profile, ProfilePhoto } from '../types';
import { calculateDistance } from '../hooks/useLocation';
import { formatLocalDate } from './localDate';

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return formatLocalDate();
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

// Fetch discovery cards — all users regardless of intent, sorted by distance
export async function fetchDiscoveryCards(
  userId: string,
  latitude: number,
  longitude: number,
  maxDistanceKm: number = 50
): Promise<DiscoveryCard[]> {
  // Fetch all profiles, intents, swipes, matches, and photos in parallel
  const [
    { data: profiles, error: profileError },
    { data: intents },
    { data: swipes },
    { data: activeMatchesAsUser1 },
    { data: activeMatchesAsUser2 },
    { data: allPhotos },
  ] = await Promise.all([
    supabase.from('profiles').select('*').neq('id', userId),
    supabase.from('work_intents').select('*').eq('intent_date', getTodayDate()).neq('user_id', userId),
    supabase.from('swipes').select('swiped_id').eq('swiper_id', userId).eq('swipe_date', getTodayDate()),
    supabase.from('matches').select('user2_id').eq('user1_id', userId).eq('status', 'active'),
    supabase.from('matches').select('user1_id').eq('user2_id', userId).eq('status', 'active'),
    supabase.from('profile_photos').select('*').neq('user_id', userId).order('position'),
  ]);

  if (profileError || !profiles) {
    console.error('Error fetching profiles:', profileError);
    return [];
  }

  // Build lookup sets
  const swipedIds = new Set((swipes || []).map((s) => s.swiped_id));
  const activeMatchIds = new Set([
    ...((activeMatchesAsUser1 || []) as Array<{ user2_id: string }>).map((m) => m.user2_id),
    ...((activeMatchesAsUser2 || []) as Array<{ user1_id: string }>).map((m) => m.user1_id),
  ]);

  // Build intent map keyed by user_id
  const intentMap = new Map<string, WorkIntent>();
  for (const intent of intents || []) {
    intentMap.set(intent.user_id, intent as WorkIntent);
  }

  // Build photo map keyed by user_id (ordered by position)
  const photoMap = new Map<string, ProfilePhoto[]>();
  for (const photo of allPhotos || []) {
    const p = photo as ProfilePhoto;
    const existing = photoMap.get(p.user_id) ?? [];
    existing.push(p);
    photoMap.set(p.user_id, existing);
  }

  const cards: DiscoveryCard[] = [];

  for (const profile of profiles) {
    if (swipedIds.has(profile.id)) continue;
    if (activeMatchIds.has(profile.id)) continue;

    const intent = intentMap.get(profile.id) ?? null;

    // Distance filtering: only apply when the user has a located intent
    let distance = 0;
    if (intent?.latitude != null && intent?.longitude != null) {
      distance = calculateDistance(latitude, longitude, intent.latitude, intent.longitude);
      if (distance > maxDistanceKm) continue;
    }

    cards.push({ profile, intent, distance, photos: photoMap.get(profile.id) ?? [] });
  }

  // Sort: users with a located intent first (by distance), then the rest
  cards.sort((a, b) => {
    const aHasLocation = a.intent?.latitude != null;
    const bHasLocation = b.intent?.latitude != null;
    if (aHasLocation && !bHasLocation) return -1;
    if (!aHasLocation && bHasLocation) return 1;
    return a.distance - b.distance;
  });

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

// ─── Time utilities ──────────────────────────────────────────────────────────

const INTENT_TIME_START = 7 * 60;  // 07:00
const INTENT_TIME_END   = 23 * 60; // 23:00
const INTENT_INTERVAL   = 30;
const INTENT_DURATION   = 120; // 2 hours default

/**
 * Returns default start/end times for a new intent.
 * Start = current time rounded up to the next 30-min interval (clamped 07:00–23:00).
 * End   = start + 2 hours (clamped to 23:00).
 */
export function getDefaultIntentTimes(): { defaultStart: string; defaultEnd: string } {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.ceil(currentMins / INTENT_INTERVAL) * INTENT_INTERVAL;
  const startMins = Math.min(Math.max(rounded, INTENT_TIME_START), INTENT_TIME_END);
  const endMins   = Math.min(startMins + INTENT_DURATION, INTENT_TIME_END);
  // Guarantee end is always after start (e.g. if startMins clamps to 23:00, allow 23:30)
  const safeEnd   = endMins > startMins ? endMins : startMins + INTENT_INTERVAL;
  return { defaultStart: _fmtTime(startMins), defaultEnd: _fmtTime(safeEnd) };
}

function _fmtTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

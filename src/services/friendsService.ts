import { supabase } from '../../lib/supabase';
import { FriendListItem, RelationshipStatus, UserSearchResult } from '../types';

type FriendshipRow = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
};

type MatchRow = {
  id: string;
  user1_id: string;
  user2_id: string;
  status?: 'active' | 'unmatched';
};

type ProfileLookupRow = {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
  phone_number: string | null;
  photo_url: string | null;
};

type WorkIntentRow = {
  user_id: string;
  available_from: string;
  available_until: string;
  location_type: string | null;
  location_name: string | null;
};

export type PendingRequestItem = {
  friendship_id: string;
  requester_id: string;
  status: 'pending';
  created_at: string;
  requester: {
    id: string;
    name: string | null;
    username: string;
    photo_url: string | null;
  };
};

type RelationshipDetail = {
  status: RelationshipStatus;
  friendshipId: string | null;
};

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function normalizeQuery(query: string): string {
  return query.replace(/,/g, ' ').trim();
}

function extractSupabaseErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;
  const maybeMessage = (error as { message?: string }).message;
  return maybeMessage || fallback;
}

async function getRelationshipDetails(
  currentUserId: string,
  userIds: string[]
): Promise<{ data: Record<string, RelationshipDetail>; error: string | null }> {
  if (userIds.length === 0) {
    return { data: {}, error: null };
  }

  const statuses: Record<string, RelationshipDetail> = {};

  for (const userId of userIds) {
    statuses[userId] = { status: 'none', friendshipId: null };
  }

  const [{ data: matchesAsUser1, error: matchError1 }, { data: matchesAsUser2, error: matchError2 }] =
    await Promise.all([
      supabase
        .from('matches')
        .select('id,user1_id,user2_id')
        .eq('user1_id', currentUserId)
        .in('user2_id', userIds),
      supabase
        .from('matches')
        .select('id,user1_id,user2_id')
        .eq('user2_id', currentUserId)
        .in('user1_id', userIds),
    ]);

  if (matchError1 || matchError2) {
    const message = extractSupabaseErrorMessage(matchError1 || matchError2, 'Failed to determine matches');
    console.error('Error determining match relationships:', message);
    return { data: statuses, error: message };
  }

  const matchRows = [...((matchesAsUser1 || []) as MatchRow[]), ...((matchesAsUser2 || []) as MatchRow[])];

  for (const match of matchRows) {
    const otherId = match.user1_id === currentUserId ? match.user2_id : match.user1_id;
    if (statuses[otherId]) {
      statuses[otherId] = { status: 'friends', friendshipId: statuses[otherId].friendshipId };
    }
  }

  const { data: friendshipsData, error: friendshipsError } = await supabase
    .from('friendships')
    .select('id,requester_id,recipient_id,status,created_at,updated_at')
    .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`);

  if (friendshipsError) {
    const message = extractSupabaseErrorMessage(friendshipsError, 'Failed to determine friendship statuses');
    console.error('Error fetching friendship statuses:', message);
    return { data: statuses, error: message };
  }

  const friendshipRows = (friendshipsData || []) as FriendshipRow[];

  for (const friendship of friendshipRows) {
    const otherId =
      friendship.requester_id === currentUserId ? friendship.recipient_id : friendship.requester_id;

    if (!statuses[otherId]) continue;

    if (friendship.status === 'accepted') {
      statuses[otherId] = { status: 'friends', friendshipId: friendship.id };
      continue;
    }

    if (friendship.status === 'pending' && statuses[otherId].status !== 'friends') {
      if (friendship.requester_id === currentUserId) {
        statuses[otherId] = { status: 'pending_sent', friendshipId: friendship.id };
      } else {
        statuses[otherId] = { status: 'pending_received', friendshipId: friendship.id };
      }
    }
  }

  return { data: statuses, error: null };
}

export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<{ data: UserSearchResult[]; error: string | null }> {
  const normalizedQuery = normalizeQuery(query);

  if (normalizedQuery.length < 3) {
    return { data: [], error: null };
  }

  const ilike = `%${normalizedQuery}%`;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,email,phone_number,name,photo_url')
    .neq('id', currentUserId)
    .or(`username.ilike.${ilike},email.ilike.${ilike},phone_number.ilike.${ilike}`)
    .limit(20);

  if (error) {
    const message = extractSupabaseErrorMessage(error, 'Failed to search users');
    console.error('Error searching users:', message);
    return { data: [], error: message };
  }

  const users = (data || []) as ProfileLookupRow[];
  const userIds = users.map((user) => user.id);
  const { data: relationshipDetails, error: relationshipError } = await getRelationshipDetails(
    currentUserId,
    userIds
  );

  const results: UserSearchResult[] = users.map((user) => {
    const detail = relationshipDetails[user.id] || { status: 'none' as RelationshipStatus, friendshipId: null };

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      name: user.name,
      photo_url: user.photo_url,
      relationship_status: detail.status,
      friendship_id: detail.friendshipId,
    };
  });

  return { data: results, error: relationshipError };
}

export async function sendFriendRequest(
  requesterId: string,
  recipientId: string
): Promise<{ friendshipId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('send_friend_request', {
    p_requester_id: requesterId,
    p_recipient_id: recipientId,
  });

  if (error) {
    const message = extractSupabaseErrorMessage(error, 'Failed to send friend request');
    console.error('Error sending friend request:', message);
    return { friendshipId: null, error: message };
  }

  return { friendshipId: (data as string) || null, error: null };
}

export async function respondToFriendRequest(
  friendshipId: string,
  userId: string,
  response: 'accept' | 'decline'
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.rpc('respond_to_friend_request', {
    p_friendship_id: friendshipId,
    p_user_id: userId,
    p_response: response,
  });

  if (error) {
    const message = extractSupabaseErrorMessage(error, 'Failed to respond to friend request');
    console.error('Error responding to friend request:', message);
    return { ok: false, error: message };
  }

  return { ok: true, error: null };
}

export async function fetchFriends(
  userId: string
): Promise<{ data: FriendListItem[]; error: string | null }> {
  const [
    { data: matchesAsUser1, error: matchError1 },
    { data: matchesAsUser2, error: matchError2 },
    { data: friendshipsData, error: friendshipsError },
  ] =
    await Promise.all([
      supabase.from('matches').select('id,user1_id,user2_id,status').eq('user1_id', userId).eq('status', 'active'),
      supabase.from('matches').select('id,user1_id,user2_id,status').eq('user2_id', userId).eq('status', 'active'),
      supabase
        .from('friendships')
        .select('id,requester_id,recipient_id,status,created_at,updated_at')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
    ]);

  if (matchError1 || matchError2 || friendshipsError) {
    const message = extractSupabaseErrorMessage(
      matchError1 || matchError2 || friendshipsError,
      'Failed to fetch friends'
    );
    console.error('Error fetching friend matches:', message);
    return { data: [], error: message };
  }

  const allMatches = [...((matchesAsUser1 || []) as MatchRow[]), ...((matchesAsUser2 || []) as MatchRow[])];
  const acceptedFriendships = (friendshipsData || []) as FriendshipRow[];

  const friendMap = new Map<string, { matchId: string }>();
  for (const match of allMatches) {
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
    if (!friendMap.has(otherUserId)) {
      friendMap.set(otherUserId, { matchId: match.id });
    }
  }

  for (const friendship of acceptedFriendships) {
    const otherUserId =
      friendship.requester_id === userId ? friendship.recipient_id : friendship.requester_id;

    if (!friendMap.has(otherUserId)) {
      friendMap.set(otherUserId, { matchId: '' });
    }
  }

  const friendIds = Array.from(friendMap.keys());
  if (friendIds.length === 0) {
    return { data: [], error: null };
  }

  const [{ data: profilesData, error: profilesError }, { data: intentsData, error: intentsError }] =
    await Promise.all([
      supabase.from('profiles').select('id,name,photo_url').in('id', friendIds),
      supabase
        .from('work_intents')
        .select('user_id,available_from,available_until,location_type,location_name')
        .eq('intent_date', getTodayDate())
        .in('user_id', friendIds),
    ]);

  if (profilesError || intentsError) {
    const message = extractSupabaseErrorMessage(profilesError || intentsError, 'Failed to fetch friend details');
    console.error('Error fetching friend details:', message);
    return { data: [], error: message };
  }

  const intentByUserId = new Map<string, WorkIntentRow>();
  for (const intent of (intentsData || []) as WorkIntentRow[]) {
    intentByUserId.set(intent.user_id, intent);
  }

  const friends: FriendListItem[] = ((profilesData || []) as Array<{
    id: string;
    name: string | null;
    photo_url: string | null;
  }>).map((profile) => {
    const intent = intentByUserId.get(profile.id);
    const matchMeta = friendMap.get(profile.id);

    return {
      user_id: profile.id,
      name: profile.name,
      photo_url: profile.photo_url,
      match_id: matchMeta?.matchId || '',
      has_intent_today: Boolean(intent),
      available_from: intent?.available_from || null,
      available_until: intent?.available_until || null,
      location_type: (intent?.location_type as FriendListItem['location_type']) || null,
      location_name: intent?.location_name || null,
    };
  });

  friends.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return { data: friends, error: null };
}

export async function fetchPendingRequests(
  userId: string
): Promise<{ data: PendingRequestItem[]; error: string | null }> {
  const { data: pendingData, error: pendingError } = await supabase
    .from('friendships')
    .select('id,requester_id,recipient_id,status,created_at,updated_at')
    .eq('recipient_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (pendingError) {
    const message = extractSupabaseErrorMessage(pendingError, 'Failed to fetch pending requests');
    console.error('Error fetching pending requests:', message);
    return { data: [], error: message };
  }

  const pendingRows = (pendingData || []) as FriendshipRow[];
  if (pendingRows.length === 0) {
    return { data: [], error: null };
  }

  const requesterIds = pendingRows.map((row) => row.requester_id);
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id,name,username,photo_url')
    .in('id', requesterIds);

  if (profileError) {
    const message = extractSupabaseErrorMessage(profileError, 'Failed to fetch requester profiles');
    console.error('Error fetching requester profiles:', message);
    return { data: [], error: message };
  }

  const requesterById = new Map<string, { id: string; name: string | null; username: string; photo_url: string | null }>();

  for (const profile of (profileData || []) as Array<{
    id: string;
    name: string | null;
    username: string;
    photo_url: string | null;
  }>) {
    requesterById.set(profile.id, profile);
  }

  const items: PendingRequestItem[] = pendingRows
    .map((row) => {
      const requester = requesterById.get(row.requester_id);
      if (!requester) return null;

      return {
        friendship_id: row.id,
        requester_id: row.requester_id,
        status: 'pending',
        created_at: row.created_at,
        requester,
      };
    })
    .filter((item): item is PendingRequestItem => item !== null);

  return { data: items, error: null };
}

export async function getPendingRequestsCount(
  userId: string
): Promise<{ count: number; error: string | null }> {
  const { data, error } = await supabase.rpc('get_pending_requests_count', {
    p_user_id: userId,
  });

  if (error) {
    const message = extractSupabaseErrorMessage(error, 'Failed to get pending request count');
    console.error('Error fetching pending request count:', message);
    return { count: 0, error: message };
  }

  return { count: typeof data === 'number' ? data : Number(data) || 0, error: null };
}

export async function getRelationshipStatuses(
  currentUserId: string,
  userIds: string[]
): Promise<{ data: Record<string, RelationshipStatus>; error: string | null }> {
  const { data: detailMap, error } = await getRelationshipDetails(currentUserId, userIds);

  const statusMap: Record<string, RelationshipStatus> = {};
  for (const userId of userIds) {
    statusMap[userId] = detailMap[userId]?.status || 'none';
  }

  return { data: statusMap, error };
}

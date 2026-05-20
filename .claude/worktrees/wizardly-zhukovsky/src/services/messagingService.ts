import { supabase } from '../../lib/supabase';
import { MatchPreview, Message } from '../types';

type MatchPreviewRow = {
  match_id: string;
  other_user_id: string;
  other_user_name: string | null;
  other_user_photo_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type SessionPreviewRow = {
  match_id: string;
  initiated_by: string;
  status: 'pending' | 'active' | 'declined' | 'completed' | 'cancelled';
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
};

type MatchReadRow = {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_last_read_at: string | null;
  user2_last_read_at: string | null;
};

function toEpoch(value: string | null | undefined): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function formatSessionDate(value: string | null): string {
  if (!value) return 'today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'today';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function toSessionPreviewText(session: SessionPreviewRow, userId: string): string {
  const byYou = session.initiated_by === userId;

  switch (session.status) {
    case 'pending':
      return byYou
        ? `Cowork invite sent for ${formatSessionDate(session.scheduled_date)}`
        : `Pending cowork invite for ${formatSessionDate(session.scheduled_date)}`;
    case 'active':
      return 'Invite accepted';
    case 'declined':
      return byYou ? 'Cowork invite declined' : 'You declined the cowork invite';
    case 'completed':
      return 'Session completed';
    case 'cancelled':
      return byYou ? 'You cancelled the cowork invite' : 'Cowork invite cancelled';
    default:
      return 'Session update';
  }
}

export async function fetchMatches(userId: string): Promise<MatchPreview[]> {
  const { data, error } = await supabase.rpc('fetch_match_previews', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }

  const rows = (data || []) as MatchPreviewRow[];
  if (rows.length === 0) return [];

  const matchIds = rows.map((row) => row.match_id);

  const [{ data: sessionsData, error: sessionsError }, { data: matchesData, error: matchesError }] =
    await Promise.all([
      supabase
        .from('sessions')
        .select('match_id, initiated_by, status, scheduled_date, created_at, updated_at')
        .in('match_id', matchIds)
        .order('updated_at', { ascending: false }),
      supabase
        .from('matches')
        .select('id, user1_id, user2_id, user1_last_read_at, user2_last_read_at')
        .in('id', matchIds),
    ]);

  if (sessionsError) {
    console.error('Error fetching session previews:', sessionsError);
  }
  if (matchesError) {
    console.error('Error fetching match read states:', matchesError);
  }

  const latestSessionByMatch = new Map<string, SessionPreviewRow>();
  ((sessionsData || []) as SessionPreviewRow[]).forEach((session) => {
    if (!latestSessionByMatch.has(session.match_id)) {
      latestSessionByMatch.set(session.match_id, session);
    }
  });

  const lastReadByMatch = new Map<string, string | null>();
  ((matchesData || []) as MatchReadRow[]).forEach((match) => {
    const myLastRead = match.user1_id === userId ? match.user1_last_read_at : match.user2_last_read_at;
    lastReadByMatch.set(match.id, myLastRead);
  });

  return rows.map((row) => {
    const latestSession = latestSessionByMatch.get(row.match_id);
    const lastMessageTime = toEpoch(row.last_message_at);
    const sessionTime = toEpoch(latestSession?.updated_at);
    const sessionWinsPreview = !!latestSession && sessionTime > lastMessageTime;
    const myLastRead = lastReadByMatch.get(row.match_id);

    const hasUnreadInvite =
      !!latestSession &&
      latestSession.status === 'pending' &&
      latestSession.initiated_by !== userId &&
      toEpoch(latestSession.created_at) > toEpoch(myLastRead);

    return {
      match_id: row.match_id,
      other_user: {
        id: row.other_user_id,
        name: row.other_user_name,
        photo_url: row.other_user_photo_url,
      },
      last_message: sessionWinsPreview
        ? toSessionPreviewText(latestSession, userId)
        : row.last_message,
      last_message_at: sessionWinsPreview ? latestSession.updated_at : row.last_message_at,
      unread_count: row.unread_count ?? 0,
      has_unread_invite: hasUnreadInvite,
      invite_badge_text: hasUnreadInvite ? 'Invite waiting' : null,
    };
  });
}

export async function fetchMessages(matchId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return (data || []) as Message[];
}

export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return data as Message;
}

export async function markChatRead(matchId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('mark_chat_read', {
    p_match_id: matchId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error marking chat as read:', error);
    return false;
  }

  return true;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_count', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return typeof data === 'number' ? data : 0;
}

export function subscribeToMessages(
  matchId: string,
  callback: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

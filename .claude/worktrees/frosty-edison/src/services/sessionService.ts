import { supabase } from '../../lib/supabase';
import { MatchPreviewOtherUser, SessionEvent, SessionRecord } from '../types';

type SessionWithParticipant = SessionRecord & {
  session_participants: { user_id: string; role: 'initiator' | 'invitee' }[];
};

export async function createSession(
  matchId: string,
  initiatorId: string,
  scheduledDate: string
): Promise<{ sessionId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_session', {
    p_match_id: matchId,
    p_initiator_id: initiatorId,
    p_scheduled_date: scheduledDate,
  });

  if (error) {
    const message = error.message || 'Failed to create session';
    console.error('Error creating session:', message);
    return { sessionId: null, error: message };
  }

  return { sessionId: typeof data === 'string' ? data : (data as string), error: null };
}

export async function respondToSession(
  sessionId: string,
  userId: string,
  response: 'accept' | 'decline'
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.rpc('respond_to_session', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_response: response,
  });

  if (error) {
    const message = error.message || 'Failed to respond to session';
    console.error('Error responding to session:', message);
    return { ok: false, error: message };
  }

  return { ok: true, error: null };
}

export async function completeSession(
  sessionId: string,
  userId: string
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.rpc('complete_session', {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error) {
    const message = error.message || 'Failed to complete session';
    console.error('Error completing session:', message);
    return { ok: false, error: message };
  }

  return { ok: true, error: null };
}

export async function cancelSession(
  sessionId: string,
  userId: string
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.rpc('cancel_session', {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error) {
    const message = error.message || 'Failed to cancel session';
    console.error('Error cancelling session:', message);
    return { ok: false, error: message };
  }

  return { ok: true, error: null };
}

export async function fetchSessionForMatch(matchId: string): Promise<SessionRecord | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('match_id', matchId)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching session for match:', error);
    return null;
  }

  return (data as SessionRecord) ?? null;
}

export async function fetchSessionsForMatch(matchId: string): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching sessions for match:', error);
    return [];
  }

  return (data || []) as SessionRecord[];
}

export async function fetchActiveSession(
  userId: string
): Promise<{ session: SessionRecord; otherUser: MatchPreviewOtherUser | null } | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(
      `
      *,
      session_participants!inner(user_id, role)
    `
    )
    .in('status', ['pending', 'active'])
    .eq('session_participants.user_id', userId);

  if (error) {
    console.error('Error fetching active session:', error);
    return null;
  }

  const sessions = (data || []) as SessionWithParticipant[];
  const session = sessions[0];

  if (!session) {
    return null;
  }

  const otherParticipant = session.session_participants.find(
    (participant) => participant.user_id !== userId
  );

  if (!otherParticipant) {
    return { session, otherUser: null };
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, photo_url')
    .eq('id', otherParticipant.user_id)
    .maybeSingle();

  if (profileError) {
    console.error('Error fetching co-worker profile:', profileError);
    return { session, otherUser: null };
  }

  return {
    session,
    otherUser: profileData
      ? { id: profileData.id, name: profileData.name, photo_url: profileData.photo_url }
      : null,
  };
}

export async function autoCompleteStaleSessions(): Promise<void> {
  const { error } = await supabase.rpc('auto_cancel_sessions');

  if (error) {
    console.error('Error auto-completing sessions:', error);
  }
}

export async function lockInSession(
  sessionId: string,
  userId: string
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.rpc('lock_in_session', {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error) {
    const message = error.message || 'Failed to lock in session';
    console.error('Error locking in session:', message);
    return { ok: false, error: message };
  }

  return { ok: true, error: null };
}

export async function fetchSessionEvents(sessionIds: string[]): Promise<SessionEvent[]> {
  if (sessionIds.length === 0) return [];
  const { data, error } = await supabase
    .from('session_events')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching session events:', error);
    return [];
  }

  return (data || []) as SessionEvent[];
}

export function subscribeToSessionEvents(
  sessionId: string,
  callback: (event: SessionEvent) => void
): () => void {
  const channel = supabase
    .channel(`session_events:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'session_events',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        callback(payload.new as SessionEvent);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToSession(
  sessionId: string,
  callback: (session: SessionRecord) => void
): () => void {
  const channel = supabase
    .channel(`sessions:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        callback(payload.new as SessionRecord);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

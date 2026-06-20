import { supabase } from '../../lib/supabase';
import { Profile, WorkIntent } from '../types';
import { formatLocalDate } from './localDate';

export type IncomingInvite = {
  id: string;
  sender_id: string;
  created_at: string;
  sender: Profile;
  intent: WorkIntent | null;
};

// Send a co-work invite. Silently tolerates the unique-pair-per-day constraint.
export async function sendInvite(
  senderId: string,
  receiverId: string
): Promise<{ alreadyInvited: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('co_work_invites')
    .insert({ sender_id: senderId, receiver_id: receiverId });

  if (error) {
    if (error.code === '23505') {
      return { alreadyInvited: true, error: null };
    }
    console.error('Error sending invite:', error);
    return { alreadyInvited: false, error: new Error(error.message) };
  }

  return { alreadyInvited: false, error: null };
}

// Receiver IDs the user has already invited today — used to filter the card list.
export async function getSentInvitesToday(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('co_work_invites')
    .select('receiver_id')
    .eq('sender_id', userId)
    .eq('expires_at', formatLocalDate());

  if (error) {
    console.error('Error fetching sent invites:', error);
    return [];
  }

  return (data || []).map((row) => row.receiver_id);
}

// Pending invites addressed to the user today, joined with sender profile + intent.
export async function getIncomingInvites(userId: string): Promise<IncomingInvite[]> {
  const today = formatLocalDate();

  const { data: invites, error } = await supabase
    .from('co_work_invites')
    .select('id, sender_id, created_at')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .eq('expires_at', today)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching incoming invites:', error);
    return [];
  }
  if (!invites || invites.length === 0) return [];

  const senderIds = invites.map((i) => i.sender_id);

  const [{ data: profiles }, { data: intents }] = await Promise.all([
    supabase.from('public_profiles').select('*').in('id', senderIds),
    supabase.from('work_intents').select('*').eq('intent_date', today).in('user_id', senderIds),
  ]);

  const profileMap = new Map<string, Profile>();
  for (const p of profiles || []) profileMap.set(p.id, p as Profile);

  const intentMap = new Map<string, WorkIntent>();
  for (const it of intents || []) intentMap.set(it.user_id, it as WorkIntent);

  return invites
    .map((i) => {
      const sender = profileMap.get(i.sender_id);
      if (!sender) return null;
      return {
        id: i.id,
        sender_id: i.sender_id,
        created_at: i.created_at,
        sender,
        intent: intentMap.get(i.sender_id) ?? null,
      } as IncomingInvite;
    })
    .filter((x): x is IncomingInvite => x !== null);
}

export async function getIncomingInviteCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('co_work_invites')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .eq('expires_at', formatLocalDate());

  if (error) {
    console.error('Error counting incoming invites:', error);
    return 0;
  }
  return count ?? 0;
}

export async function respondToInvite(
  inviteId: string,
  response: 'accepted' | 'declined'
): Promise<{ matchId: string | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('respond_to_invite', {
    invite_id: inviteId,
    response,
  });

  if (error) {
    console.error('Error responding to invite:', error);
    return { matchId: null, error: new Error(error.message) };
  }

  return { matchId: (data as { match_id: string | null })?.match_id ?? null, error: null };
}

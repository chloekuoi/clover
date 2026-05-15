import { supabase } from '../../lib/supabase';
import {
  GroupChat,
  GroupChatPreview,
  GroupMember,
  GroupMessage,
  GroupSession,
  GroupSessionRsvp,
} from '../types';

type GroupChatPreviewRow = {
  group_chat_id: string;
  name: string;
  member_count: number;
  last_message: string | null;
  last_message_at: string | null;
  last_sender_name: string | null;
  unread_count: number;
};

type GroupMessageRow = {
  id: string;
  group_chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type GroupSessionRow = {
  id: string;
  group_chat_id: string;
  proposed_by: string;
  scheduled_date: string;
  status: 'proposed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

type GroupSessionRsvpRow = {
  id: string;
  group_session_id: string;
  user_id: string;
  response: 'yes' | 'no';
  created_at: string;
  updated_at: string;
};

type GroupMemberRow = {
  id: string;
  group_chat_id: string;
  user_id: string;
  last_read_at: string;
  created_at: string;
};

type ProfileLookupRow = {
  id: string;
  name: string | null;
  photo_url: string | null;
};

function toTrimmedContent(content: string): string {
  return content.trim();
}

async function fetchProfilesByIds(userIds: string[]): Promise<Map<string, ProfileLookupRow>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const uniqueIds = Array.from(new Set(userIds));
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, photo_url')
    .in('id', uniqueIds);

  if (error) {
    console.error('Error fetching group chat profiles:', error);
    return new Map();
  }

  return new Map(
    ((data || []) as ProfileLookupRow[]).map((profile) => [profile.id, profile])
  );
}

function toGroupChatPreview(row: GroupChatPreviewRow): GroupChatPreview {
  return {
    groupChatId: row.group_chat_id,
    name: row.name,
    memberCount: row.member_count,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    lastSenderName: row.last_sender_name,
    unreadCount: row.unread_count ?? 0,
  };
}

async function hydrateGroupMessages(rows: GroupMessageRow[]): Promise<GroupMessage[]> {
  const profilesById = await fetchProfilesByIds(rows.map((row) => row.sender_id));

  return rows.map((row) => {
    const sender = profilesById.get(row.sender_id);
    return {
      ...row,
      sender_name: sender?.name ?? null,
      sender_photo_url: sender?.photo_url ?? null,
    };
  });
}

export async function fetchGroupChats(userId: string): Promise<GroupChatPreview[]> {
  const { data, error } = await supabase.rpc('fetch_group_chat_previews', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching group chats:', error);
    return [];
  }

  return ((data || []) as GroupChatPreviewRow[]).map(toGroupChatPreview);
}

export async function fetchGroupChat(groupChatId: string): Promise<GroupChat | null> {
  const { data, error } = await supabase
    .from('group_chats')
    .select('id, name, created_by, created_at, updated_at')
    .eq('id', groupChatId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching group chat:', error);
    return null;
  }

  return (data as GroupChat | null) || null;
}

export async function createGroupChat(
  name: string,
  creatorId: string,
  memberIds: string[]
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_group_chat', {
    p_name: name,
    p_creator_id: creatorId,
    p_member_ids: memberIds,
  });

  if (error) {
    console.error('Error creating group chat:', error);
    return null;
  }

  return typeof data === 'string' ? data : null;
}

export async function fetchGroupMessages(groupChatId: string): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from('group_messages')
    .select('id, group_chat_id, sender_id, content, created_at')
    .eq('group_chat_id', groupChatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching group messages:', error);
    return [];
  }

  return hydrateGroupMessages((data || []) as GroupMessageRow[]);
}

export async function fetchGroupMembers(groupChatId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('id, group_chat_id, user_id, last_read_at, created_at')
    .eq('group_chat_id', groupChatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching group members:', error);
    return [];
  }

  const rows = (data || []) as GroupMemberRow[];
  const profilesById = await fetchProfilesByIds(rows.map((row) => row.user_id));

  return rows.map((row) => {
    const profile = profilesById.get(row.user_id);
    return {
      ...row,
      name: profile?.name ?? null,
      photo_url: profile?.photo_url ?? null,
    };
  });
}

export async function fetchGroupSessions(groupChatId: string): Promise<GroupSession[]> {
  const { data, error } = await supabase
    .from('group_sessions')
    .select('id, group_chat_id, proposed_by, scheduled_date, status, created_at, updated_at')
    .eq('group_chat_id', groupChatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching group sessions:', error);
    return [];
  }

  return (data || []) as GroupSession[];
}

export async function fetchGroupSessionRsvps(groupSessionIds: string[]): Promise<GroupSessionRsvp[]> {
  if (groupSessionIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('group_session_rsvps')
    .select('id, group_session_id, user_id, response, created_at, updated_at')
    .in('group_session_id', groupSessionIds);

  if (error) {
    console.error('Error fetching group session RSVPs:', error);
    return [];
  }

  return (data || []) as GroupSessionRsvpRow[];
}

export async function sendGroupMessage(
  groupChatId: string,
  senderId: string,
  content: string
): Promise<GroupMessage | null> {
  const trimmedContent = toTrimmedContent(content);
  if (!trimmedContent) {
    return null;
  }

  const { data, error } = await supabase
    .from('group_messages')
    .insert({
      group_chat_id: groupChatId,
      sender_id: senderId,
      content: trimmedContent,
    })
    .select('id, group_chat_id, sender_id, content, created_at')
    .single();

  if (error) {
    console.error('Error sending group message:', error);
    return null;
  }

  const [message] = await hydrateGroupMessages([data as GroupMessageRow]);
  return message || null;
}

export async function proposeGroupSession(
  groupChatId: string,
  proposedBy: string,
  scheduledDate: string
): Promise<GroupSession | null> {
  const { data, error } = await supabase
    .from('group_sessions')
    .insert({
      group_chat_id: groupChatId,
      proposed_by: proposedBy,
      scheduled_date: scheduledDate,
      status: 'proposed',
    })
    .select('id, group_chat_id, proposed_by, scheduled_date, status, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error proposing group session:', error);
    return null;
  }

  return (data as GroupSessionRow) || null;
}

export async function rsvpGroupSession(
  groupSessionId: string,
  userId: string,
  response: 'yes' | 'no'
): Promise<boolean> {
  const { error } = await supabase.rpc('rsvp_group_session', {
    p_group_session_id: groupSessionId,
    p_user_id: userId,
    p_response: response,
  });

  if (error) {
    console.error('Error RSVPing to group session:', error);
    return false;
  }

  return true;
}

export async function cancelGroupSession(groupSessionId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_sessions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupSessionId)
    .eq('proposed_by', userId);

  if (error) {
    console.error('Error cancelling group session:', error);
    return false;
  }

  return true;
}

export async function addGroupMembers(groupChatId: string, userIds: string[]): Promise<boolean> {
  const { error } = await supabase.rpc('add_group_members', {
    p_group_chat_id: groupChatId,
    p_user_ids: userIds,
  });

  if (error) {
    console.error('Error adding group members:', error);
    return false;
  }

  return true;
}

export async function leaveGroup(groupChatId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('leave_group', {
    p_group_chat_id: groupChatId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error leaving group:', error);
    return false;
  }

  return true;
}

export async function renameGroup(groupChatId: string, newName: string): Promise<boolean> {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    return false;
  }

  const { error } = await supabase
    .from('group_chats')
    .update({
      name: trimmedName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupChatId);

  if (error) {
    console.error('Error renaming group:', error);
    return false;
  }

  return true;
}

export async function markGroupRead(groupChatId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_group_read', {
    p_group_chat_id: groupChatId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error marking group chat as read:', error);
  }
}

export function subscribeToGroupMessages(
  groupChatId: string,
  callback: (msg: GroupMessage) => void
): () => void {
  const channel = supabase
    .channel(`group_messages:${groupChatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_chat_id=eq.${groupChatId}`,
      },
      async (payload) => {
        const row = payload.new as GroupMessageRow;
        const [message] = await hydrateGroupMessages([row]);
        if (message) {
          callback(message);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToGroupSessions(
  groupChatId: string,
  callback: (session: GroupSession) => void
): () => void {
  const channel = supabase
    .channel(`group_sessions:${groupChatId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_sessions',
        filter: `group_chat_id=eq.${groupChatId}`,
      },
      (payload) => {
        callback(payload.new as GroupSession);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

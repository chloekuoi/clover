import { User, Session, AuthError } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  username: string;
  photo_url: string | null;
  work_type: string | null;
  interests: string[] | null;
  bio: string | null;
  phone_number: string | null;
  tagline: string | null;
  currently_working_on: string | null;
  work: string | null;
  school: string | null;
  birthday: string | null;
  neighborhood: string | null;
  city: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

// Discovery feature types
export type WorkStyle = 'Deep focus' | 'Chat mode' | 'Flexible';

export type LocationType =
  | 'Cafe'
  | 'Library'
  | 'Anywhere';

export type WorkIntent = {
  id: string;
  user_id: string;
  task_description: string;
  available_from: string; // TIME as string "HH:MM:SS"
  available_until: string;
  work_style: WorkStyle;
  location_type: LocationType;
  location_name: string | null;
  latitude: number;
  longitude: number;
  intent_date: string; // DATE as string "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
};

export type Swipe = {
  id: string;
  swiper_id: string;
  swiped_id: string;
  direction: 'right' | 'left';
  swipe_date: string;
  created_at: string;
};

export type DiscoveryCard = {
  profile: Profile;
  intent: WorkIntent;
  distance: number; // in kilometers
};

// Matches & messaging types
export type MatchStatus = 'active' | 'unmatched';

export type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  status: MatchStatus;
  unmatched_by: string | null;
  unmatched_at: string | null;
  user1_last_read_at: string;
  user2_last_read_at: string;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type MatchPreviewOtherUser = {
  id: string;
  name: string | null;
  photo_url: string | null;
};

export type MatchPreview = {
  match_id: string;
  other_user: MatchPreviewOtherUser;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  has_unread_invite: boolean;
  invite_badge_text: string | null;
};

export type GroupChat = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  id: string;
  group_chat_id: string;
  user_id: string;
  name: string | null;
  photo_url: string | null;
  last_read_at: string;
  created_at: string;
};

export type GroupMessage = {
  id: string;
  group_chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string | null;
  sender_photo_url: string | null;
};

export type GroupSessionStatus = 'proposed' | 'completed' | 'cancelled';

export type GroupSession = {
  id: string;
  group_chat_id: string;
  proposed_by: string;
  scheduled_date: string;
  status: GroupSessionStatus;
  created_at: string;
  updated_at: string;
};

export type GroupSessionRsvp = {
  id: string;
  group_session_id: string;
  user_id: string;
  response: 'yes' | 'no';
  created_at: string;
  updated_at: string;
};

export type GroupChatPreview = {
  groupChatId: string;
  name: string;
  memberCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSenderName: string | null;
  unreadCount: number;
};

export type GroupTimelineItem =
  | { type: 'message'; message: GroupMessage }
  | { type: 'session'; session: GroupSession };

// Sessions types
export type SessionStatus = 'pending' | 'active' | 'declined' | 'completed' | 'cancelled';

export type SessionRecord = {
  id: string;
  match_id: string;
  initiated_by: string;
  status: SessionStatus;
  session_date: string; // DATE as string "YYYY-MM-DD"
  scheduled_date?: string;
  accepted_at: string | null;
  completed_at: string | null;
  completed_ack?: boolean | null;
  locked_by_initiator_at?: string | null;
  locked_by_invitee_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionParticipant = {
  id: string;
  session_id: string;
  user_id: string;
  role: 'initiator' | 'invitee';
  created_at: string;
};

export type SessionEvent = {
  id: string;
  session_id: string;
  event_type: string;
  message: string;
  created_at: string;
};

export type ChatTimelineItem =
  | { type: 'message'; message: Message }
  | { type: 'session'; session: SessionRecord }
  | { type: 'event'; event: SessionEvent };

export type ProfilePhoto = {
  id: string;
  user_id: string;
  photo_url: string;
  position: number;
  created_at: string;
};

// Phase 5 friends types
export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export type Friendship = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

export type FriendListItem = {
  user_id: string;
  name: string | null;
  photo_url: string | null;
  match_id: string;
  has_intent_today: boolean;
  available_from: string | null;
  available_until: string | null;
  location_type: LocationType | null;
  location_name: string | null;
};

export type RelationshipStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'friends';

export type UserSearchResult = {
  id: string;
  username: string;
  email: string | null;
  phone_number: string | null;
  name: string | null;
  photo_url: string | null;
  relationship_status: RelationshipStatus;
  friendship_id: string | null;
};

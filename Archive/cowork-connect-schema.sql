-- CoWork Connect - Supabase Schema
-- Run this in Supabase SQL Editor to set up your database

-- ============================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  one_liner TEXT,
  city TEXT,
  location GEOGRAPHY(POINT, 4326), -- PostGIS for lat/lng
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Username constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format 
CHECK (username ~* '^[a-z0-9_]{3,20}$');

-- Index for username search
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Index for location queries
CREATE INDEX idx_profiles_location ON public.profiles USING GIST(location);

-- ============================================
-- 2. INTENTS TABLE (daily availability)
-- ============================================
CREATE TYPE location_pref AS ENUM ('cafe', 'library', 'video', 'anywhere');
CREATE TYPE time_pref AS ENUM ('morning', 'afternoon', 'evening');

CREATE TABLE public.intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  task TEXT NOT NULL,
  location_pref location_pref NOT NULL DEFAULT 'anywhere',
  area TEXT, -- neighborhood name
  time_prefs time_pref[] NOT NULL DEFAULT '{}',
  is_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for finding available users
CREATE INDEX idx_intents_available ON public.intents(is_available, updated_at);

-- ============================================
-- 3. SWIPES TABLE
-- ============================================
CREATE TYPE swipe_direction AS ENUM ('left', 'right');

CREATE TABLE public.swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  direction swipe_direction NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate swipes on same day
  UNIQUE(from_user_id, to_user_id, (created_at::date))
);

-- Index for checking mutual swipes
CREATE INDEX idx_swipes_lookup ON public.swipes(to_user_id, from_user_id, direction);

-- ============================================
-- 4. MATCHES TABLE (for history/analytics)
-- ============================================
CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure consistent ordering and no duplicates
  CONSTRAINT users_ordered CHECK (user_1_id < user_2_id),
  UNIQUE(user_1_id, user_2_id)
);

-- ============================================
-- 5. FRIENDSHIPS TABLE
-- ============================================
CREATE TYPE friendship_status AS ENUM ('active', 'pending');

CREATE TABLE public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status friendship_status NOT NULL DEFAULT 'active',
  last_cowork_at TIMESTAMP WITH TIME ZONE, -- null until first co-work
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, friend_id)
);

-- Indexes for friend queries
CREATE INDEX idx_friendships_user ON public.friendships(user_id, status);
CREATE INDEX idx_friendships_expiry ON public.friendships(user_id, status, last_cowork_at, created_at);

-- ============================================
-- 6. COWORK SESSIONS TABLE
-- ============================================
CREATE TABLE public.cowork_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT session_users_ordered CHECK (user_1_id < user_2_id)
);

-- ============================================
-- 7. INVITES TABLE
-- ============================================
CREATE TABLE public.invites (
  id TEXT PRIMARY KEY, -- short code like "abc123"
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  claimed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 8. MESSAGES TABLE
-- ============================================
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL, -- format: lesserUserId_greaterUserId
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching conversation messages
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to generate conversation ID from two user IDs
CREATE OR REPLACE FUNCTION get_conversation_id(user_a UUID, user_b UUID)
RETURNS TEXT AS $$
BEGIN
  IF user_a < user_b THEN
    RETURN user_a || '_' || user_b;
  ELSE
    RETURN user_b || '_' || user_a;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate distance in miles between two points
CREATE OR REPLACE FUNCTION distance_miles(loc1 GEOGRAPHY, loc2 GEOGRAPHY)
RETURNS FLOAT AS $$
BEGIN
  RETURN ST_Distance(loc1, loc2) / 1609.34; -- meters to miles
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to count active friends
CREATE OR REPLACE FUNCTION count_active_friends(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.friendships 
    WHERE user_id = p_user_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cowork_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Intents: anyone can read available intents, only owner can modify
CREATE POLICY "Available intents are viewable" 
ON public.intents FOR SELECT USING (true);

CREATE POLICY "Users can manage own intent" 
ON public.intents FOR ALL USING (auth.uid() = user_id);

-- Swipes: only creator can see/create
CREATE POLICY "Users can create own swipes" 
ON public.swipes FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can see swipes involving them" 
ON public.swipes FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Matches: both users can see
CREATE POLICY "Users can see own matches" 
ON public.matches FOR SELECT USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "System can create matches" 
ON public.matches FOR INSERT WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Friendships: users can see/manage their own
CREATE POLICY "Users can see own friendships" 
ON public.friendships FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage friendships" 
ON public.friendships FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Cowork sessions: both users can see/create
CREATE POLICY "Users can see own sessions" 
ON public.cowork_sessions FOR SELECT 
USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Users can create sessions" 
ON public.cowork_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

-- Invites: creator can see own, anyone can claim
CREATE POLICY "Users can see own invites" 
ON public.invites FOR SELECT USING (auth.uid() = from_user_id);

CREATE POLICY "Users can create invites" 
ON public.invites FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Anyone can claim invite" 
ON public.invites FOR UPDATE USING (claimed_by_user_id IS NULL);

-- Messages: only conversation participants can see/create
CREATE POLICY "Users can see own messages" 
ON public.messages FOR SELECT 
USING (conversation_id LIKE auth.uid()::text || '_%' OR conversation_id LIKE '%_' || auth.uid()::text);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- 11. REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for messages (for chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for friendships (for friend list updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- ============================================
-- 12. AUTOMATIC TIMESTAMP UPDATES
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER intents_updated_at
  BEFORE UPDATE ON public.intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 13. CRON JOB FOR EXPIRY (Supabase pg_cron)
-- ============================================
-- Run this separately after enabling pg_cron extension

-- SELECT cron.schedule(
--   'expire-inactive-friendships',
--   '0 0 * * *', -- Run daily at midnight
--   $$
--   -- Delete expired active friendships
--   DELETE FROM public.friendships
--   WHERE status = 'active'
--     AND (
--       (last_cowork_at IS NULL AND created_at < NOW() - INTERVAL '30 days')
--       OR
--       (last_cowork_at IS NOT NULL AND last_cowork_at < NOW() - INTERVAL '30 days')
--     );
--   
--   -- Promote pending friends to fill slots (handled by app logic for notifications)
--   $$
-- );

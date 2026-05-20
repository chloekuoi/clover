-- Phase 5: Friendships Database Setup
-- Run this in the Supabase SQL Editor

-- 1) Add phone number to profiles for friend search
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 2) Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (requester_id <> recipient_id)
);

-- Enforce one relationship row per unordered user pair.
CREATE UNIQUE INDEX IF NOT EXISTS idx_friendships_pair_unique
  ON friendships ((LEAST(requester_id, recipient_id)), (GREATEST(requester_id, recipient_id)));

CREATE INDEX IF NOT EXISTS idx_friendships_requester_status
  ON friendships (requester_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_recipient_status
  ON friendships (recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_created_at
  ON friendships (created_at DESC);

-- 3) Send friend request
-- - New request: insert pending
-- - Same direction pending: error
-- - Reverse direction pending: auto-accept existing row + create match
-- - Accepted/declined existing relationship: error
CREATE OR REPLACE FUNCTION send_friend_request(p_requester_id UUID, p_recipient_id UUID)
RETURNS UUID AS $$
DECLARE
  v_friendship friendships%ROWTYPE;
  v_friendship_id UUID;
BEGIN
  IF p_requester_id = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot send request to yourself';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = p_recipient_id
  ) THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM matches m
    WHERE m.user1_id = LEAST(p_requester_id, p_recipient_id)
      AND m.user2_id = GREATEST(p_requester_id, p_recipient_id)
  ) THEN
    RAISE EXCEPTION 'Already friends';
  END IF;

  SELECT * INTO v_friendship
  FROM friendships
  WHERE LEAST(requester_id, recipient_id) = LEAST(p_requester_id, p_recipient_id)
    AND GREATEST(requester_id, recipient_id) = GREATEST(p_requester_id, p_recipient_id)
  LIMIT 1;

  IF FOUND THEN
    IF v_friendship.status = 'accepted' THEN
      RAISE EXCEPTION 'Already friends';
    ELSIF v_friendship.status = 'declined' THEN
      RAISE EXCEPTION 'Cannot send request to this user';
    ELSIF v_friendship.status = 'pending' THEN
      IF v_friendship.requester_id = p_requester_id AND v_friendship.recipient_id = p_recipient_id THEN
        RAISE EXCEPTION 'Friend request already sent';
      END IF;

      UPDATE friendships
      SET status = 'accepted', updated_at = NOW()
      WHERE id = v_friendship.id
      RETURNING id INTO v_friendship_id;

      PERFORM create_match(p_requester_id, p_recipient_id);

      RETURN v_friendship_id;
    END IF;
  END IF;

  INSERT INTO friendships (requester_id, recipient_id, status)
  VALUES (p_requester_id, p_recipient_id, 'pending')
  RETURNING id INTO v_friendship_id;

  RETURN v_friendship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Respond to pending request (recipient only)
CREATE OR REPLACE FUNCTION respond_to_friend_request(
  p_friendship_id UUID,
  p_user_id UUID,
  p_response TEXT
)
RETURNS VOID AS $$
DECLARE
  v_requester_id UUID;
  v_recipient_id UUID;
  v_status TEXT;
BEGIN
  IF p_response NOT IN ('accept', 'decline') THEN
    RAISE EXCEPTION 'Invalid response';
  END IF;

  SELECT requester_id, recipient_id, status
  INTO v_requester_id, v_recipient_id, v_status
  FROM friendships
  WHERE id = p_friendship_id;

  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Friendship not found';
  END IF;

  IF p_user_id <> v_recipient_id THEN
    RAISE EXCEPTION 'Only recipient can respond to friend request';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Friend request is not pending';
  END IF;

  IF p_response = 'accept' THEN
    UPDATE friendships
    SET status = 'accepted', updated_at = NOW()
    WHERE id = p_friendship_id;

    PERFORM create_match(v_requester_id, v_recipient_id);
  ELSE
    UPDATE friendships
    SET status = 'declined', updated_at = NOW()
    WHERE id = p_friendship_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Pending incoming request count
CREATE OR REPLACE FUNCTION get_pending_requests_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM friendships
  WHERE recipient_id = p_user_id
    AND status = 'pending';
$$ LANGUAGE sql SECURITY DEFINER;

-- 6) Enable RLS and policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own friendships" ON friendships;
CREATE POLICY "Users can read own friendships" ON friendships
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- 7) Add friendships table to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'friendships'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships';
  END IF;
END
$$;

-- Phase 3: Matching & Messaging Database Setup
-- Run this in the Supabase SQL Editor

-- 1. Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  matched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user1_last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user2_last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create match creation function (idempotent)
CREATE OR REPLACE FUNCTION create_match(p_user1 UUID, p_user2 UUID)
RETURNS UUID AS $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
  v_match_id UUID;
BEGIN
  v_user1 := LEAST(p_user1, p_user2);
  v_user2 := GREATEST(p_user1, p_user2);

  INSERT INTO matches (user1_id, user2_id)
  VALUES (v_user1, v_user2)
  ON CONFLICT (user1_id, user2_id) DO NOTHING
  RETURNING id INTO v_match_id;

  IF v_match_id IS NULL THEN
    SELECT id INTO v_match_id
    FROM matches
    WHERE user1_id = v_user1 AND user2_id = v_user2;
  END IF;

  RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create mark_chat_read function
CREATE OR REPLACE FUNCTION mark_chat_read(p_match_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE matches
  SET
    user1_last_read_at = CASE
      WHEN user1_id = p_user_id THEN NOW()
      ELSE user1_last_read_at
    END,
    user2_last_read_at = CASE
      WHEN user2_id = p_user_id THEN NOW()
      ELSE user2_last_read_at
    END
  WHERE id = p_match_id
    AND (user1_id = p_user_id OR user2_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fetch match previews function
CREATE OR REPLACE FUNCTION fetch_match_previews(p_user_id UUID)
RETURNS TABLE (
  match_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_photo_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER
) AS $$
  WITH matches_for_user AS (
    SELECT
      m.*,
      CASE
        WHEN m.user1_id = p_user_id THEN m.user2_id
        ELSE m.user1_id
      END AS other_user_id,
      CASE
        WHEN m.user1_id = p_user_id THEN m.user1_last_read_at
        ELSE m.user2_last_read_at
      END AS last_read_at
    FROM matches m
    WHERE m.user1_id = p_user_id OR m.user2_id = p_user_id
  ),
  last_messages AS (
    SELECT
      mf.id AS match_id,
      lm.content AS content,
      lm.created_at AS created_at
    FROM matches_for_user mf
    LEFT JOIN LATERAL (
      SELECT content, created_at
      FROM messages
      WHERE match_id = mf.id
      ORDER BY created_at DESC
      LIMIT 1
    ) lm ON TRUE
  ),
  unread_counts AS (
    SELECT
      mf.id AS match_id,
      COUNT(*)::INTEGER AS unread_count
    FROM matches_for_user mf
    JOIN messages msg ON msg.match_id = mf.id
    WHERE msg.sender_id <> p_user_id
      AND msg.created_at > mf.last_read_at
    GROUP BY mf.id
  ),
  declined_counts AS (
    SELECT
      mf.id AS match_id,
      COUNT(*)::INTEGER AS declined_count
    FROM matches_for_user mf
    JOIN sessions s ON s.match_id = mf.id
    WHERE s.status = 'declined'
      AND s.initiated_by = p_user_id
      AND s.updated_at > mf.last_read_at
    GROUP BY mf.id
  )
  SELECT
    mf.id AS match_id,
    mf.other_user_id,
    p.name AS other_user_name,
    p.photo_url AS other_user_photo_url,
    lm.content AS last_message,
    COALESCE(lm.created_at, mf.matched_at) AS last_message_at,
    COALESCE(uc.unread_count, 0) + COALESCE(dc.declined_count, 0) AS unread_count
  FROM matches_for_user mf
  JOIN profiles p ON p.id = mf.other_user_id
  LEFT JOIN last_messages lm ON lm.match_id = mf.id
  LEFT JOIN unread_counts uc ON uc.match_id = mf.id
  LEFT JOIN declined_counts dc ON dc.match_id = mf.id
  ORDER BY COALESCE(lm.created_at, mf.matched_at) DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Get total unread count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(unread_count), 0)::INTEGER
  FROM fetch_match_previews(p_user_id);
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Enable RLS on matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own matches" ON matches
  FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 8. Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

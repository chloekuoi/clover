-- Phase 8: Unmatch
-- Run this in the Supabase SQL Editor

-- 1. Add soft-unmatch columns to matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS unmatched_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unmatched_at TIMESTAMPTZ;

-- 2. Backfill existing rows
UPDATE matches
SET status = 'active'
WHERE status IS NULL;

-- 3. Enforce allowed statuses
ALTER TABLE matches
  DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE matches
  ADD CONSTRAINT matches_status_check
  CHECK (status IN ('active', 'unmatched'));

-- 4. Helpful indexes
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_unmatched_at ON matches(unmatched_at);

-- 5. Unmatch RPC
CREATE OR REPLACE FUNCTION unmatch_user(
  p_match_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
  v_status TEXT;
BEGIN
  SELECT user1_id, user2_id, status
  INTO v_user1, v_user2, v_status
  FROM matches
  WHERE id = p_match_id;

  IF v_user1 IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authenticated user does not match caller';
  END IF;

  IF p_user_id <> v_user1 AND p_user_id <> v_user2 THEN
    RAISE EXCEPTION 'User is not part of this match';
  END IF;

  IF v_status = 'unmatched' THEN
    RETURN TRUE;
  END IF;

  UPDATE matches
  SET
    status = 'unmatched',
    unmatched_by = p_user_id,
    unmatched_at = NOW()
  WHERE id = p_match_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update create_match to reactivate unmatched rows
CREATE OR REPLACE FUNCTION create_match(p_user1 UUID, p_user2 UUID)
RETURNS UUID AS $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
  v_match_id UUID;
  v_status TEXT;
BEGIN
  v_user1 := LEAST(p_user1, p_user2);
  v_user2 := GREATEST(p_user1, p_user2);

  SELECT id, status
  INTO v_match_id, v_status
  FROM matches
  WHERE user1_id = v_user1
    AND user2_id = v_user2
  LIMIT 1;

  IF v_match_id IS NULL THEN
    INSERT INTO matches (user1_id, user2_id, status)
    VALUES (v_user1, v_user2, 'active')
    RETURNING id INTO v_match_id;

    RETURN v_match_id;
  END IF;

  IF v_status = 'unmatched' THEN
    UPDATE matches
    SET
      status = 'active',
      unmatched_by = NULL,
      unmatched_at = NULL,
      matched_at = NOW(),
      user1_last_read_at = NOW(),
      user2_last_read_at = NOW()
    WHERE id = v_match_id;
  END IF;

  RETURN v_match_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update mark_chat_read to ignore unmatched matches
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
    AND status = 'active'
    AND (user1_id = p_user_id OR user2_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update match previews to exclude unmatched rows
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
    WHERE (m.user1_id = p_user_id OR m.user2_id = p_user_id)
      AND m.status = 'active'
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

-- 9. Update total unread count to use active previews only
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(unread_count), 0)::INTEGER
  FROM fetch_match_previews(p_user_id);
$$ LANGUAGE sql SECURITY DEFINER;

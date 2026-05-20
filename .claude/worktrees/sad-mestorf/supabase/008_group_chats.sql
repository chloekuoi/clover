-- Phase 7: Group Chat
-- Run this in the Supabase SQL Editor

-- 1. Create group chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create group members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (group_chat_id, user_id)
);

-- 3. Create group messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Create group sessions table
CREATE TABLE IF NOT EXISTS group_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE NOT NULL,
  proposed_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Create group session RSVPs table
CREATE TABLE IF NOT EXISTS group_session_rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_session_id UUID REFERENCES group_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (group_session_id, user_id)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_chat_id ON group_members(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_chat_id ON group_messages(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_group_sessions_group_chat_id ON group_sessions(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_sessions_created_at ON group_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_group_sessions_status ON group_sessions(status);
CREATE INDEX IF NOT EXISTS idx_group_session_rsvps_group_session_id ON group_session_rsvps(group_session_id);
CREATE INDEX IF NOT EXISTS idx_group_session_rsvps_user_id ON group_session_rsvps(user_id);

-- 7. Create group chat RPC
CREATE OR REPLACE FUNCTION create_group_chat(
  p_name TEXT,
  p_creator_id UUID,
  p_member_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  v_group_chat_id UUID;
  v_member_id UUID;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_creator_id THEN
    RAISE EXCEPTION 'Authenticated user does not match creator';
  END IF;

  IF COALESCE(BTRIM(p_name), '') = '' THEN
    RAISE EXCEPTION 'Group name is required';
  END IF;

  IF p_member_ids IS NULL OR array_length(p_member_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one member is required';
  END IF;

  INSERT INTO group_chats (name, created_by)
  VALUES (BTRIM(p_name), p_creator_id)
  RETURNING id INTO v_group_chat_id;

  INSERT INTO group_members (group_chat_id, user_id)
  VALUES (v_group_chat_id, p_creator_id)
  ON CONFLICT (group_chat_id, user_id) DO NOTHING;

  FOREACH v_member_id IN ARRAY p_member_ids
  LOOP
    IF v_member_id IS NULL OR v_member_id = p_creator_id THEN
      CONTINUE;
    END IF;

    INSERT INTO group_members (group_chat_id, user_id)
    VALUES (v_group_chat_id, v_member_id)
    ON CONFLICT (group_chat_id, user_id) DO NOTHING;
  END LOOP;

  RETURN v_group_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fetch group chat previews RPC
CREATE OR REPLACE FUNCTION fetch_group_chat_previews(p_user_id UUID)
RETURNS TABLE (
  group_chat_id UUID,
  name TEXT,
  member_count INTEGER,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_sender_name TEXT,
  unread_count INTEGER
) AS $$
  WITH groups_for_user AS (
    SELECT
      gc.id,
      gc.name,
      gm.last_read_at
    FROM group_chats gc
    JOIN group_members gm ON gm.group_chat_id = gc.id
    WHERE gm.user_id = p_user_id
  ),
  member_counts AS (
    SELECT
      gm.group_chat_id,
      COUNT(*)::INTEGER AS member_count
    FROM group_members gm
    GROUP BY gm.group_chat_id
  ),
  last_messages AS (
    SELECT
      gfu.id AS group_chat_id,
      msg.content,
      msg.created_at,
      p.name AS sender_name
    FROM groups_for_user gfu
    LEFT JOIN LATERAL (
      SELECT sender_id, content, created_at
      FROM group_messages
      WHERE group_chat_id = gfu.id
      ORDER BY created_at DESC
      LIMIT 1
    ) msg ON TRUE
    LEFT JOIN profiles p ON p.id = msg.sender_id
  ),
  unread_counts AS (
    SELECT
      gfu.id AS group_chat_id,
      COUNT(gm.id)::INTEGER AS unread_count
    FROM groups_for_user gfu
    LEFT JOIN group_messages gm
      ON gm.group_chat_id = gfu.id
     AND gm.sender_id <> p_user_id
     AND gm.created_at > gfu.last_read_at
    GROUP BY gfu.id
  )
  SELECT
    gfu.id AS group_chat_id,
    gfu.name,
    COALESCE(mc.member_count, 0) AS member_count,
    lm.content AS last_message,
    lm.created_at AS last_message_at,
    lm.sender_name AS last_sender_name,
    COALESCE(uc.unread_count, 0) AS unread_count
  FROM groups_for_user gfu
  LEFT JOIN member_counts mc ON mc.group_chat_id = gfu.id
  LEFT JOIN last_messages lm ON lm.group_chat_id = gfu.id
  LEFT JOIN unread_counts uc ON uc.group_chat_id = gfu.id
  ORDER BY lm.created_at DESC NULLS LAST, gfu.name ASC;
$$ LANGUAGE sql SECURITY DEFINER;

-- 9. Add group members RPC
CREATE OR REPLACE FUNCTION add_group_members(
  p_group_chat_id UUID,
  p_user_ids UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_chat_id = p_group_chat_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only members can add people to this group';
  END IF;

  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN TRUE;
  END IF;

  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    IF v_user_id IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO group_members (group_chat_id, user_id)
    VALUES (p_group_chat_id, v_user_id)
    ON CONFLICT (group_chat_id, user_id) DO NOTHING;
  END LOOP;

  UPDATE group_chats
  SET updated_at = NOW()
  WHERE id = p_group_chat_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Leave group RPC
CREATE OR REPLACE FUNCTION leave_group(
  p_group_chat_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authenticated user does not match leaving user';
  END IF;

  DELETE FROM group_members
  WHERE group_chat_id = p_group_chat_id
    AND user_id = p_user_id;

  UPDATE group_chats
  SET updated_at = NOW()
  WHERE id = p_group_chat_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RSVP group session RPC
CREATE OR REPLACE FUNCTION rsvp_group_session(
  p_group_session_id UUID,
  p_user_id UUID,
  p_response TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_group_chat_id UUID;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authenticated user does not match RSVP user';
  END IF;

  IF p_response NOT IN ('yes', 'no') THEN
    RAISE EXCEPTION 'Invalid RSVP response';
  END IF;

  SELECT group_chat_id INTO v_group_chat_id
  FROM group_sessions
  WHERE id = p_group_session_id;

  IF v_group_chat_id IS NULL THEN
    RAISE EXCEPTION 'Group session not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_chat_id = v_group_chat_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a member of this group';
  END IF;

  INSERT INTO group_session_rsvps (group_session_id, user_id, response)
  VALUES (p_group_session_id, p_user_id, p_response)
  ON CONFLICT (group_session_id, user_id)
  DO UPDATE SET
    response = EXCLUDED.response,
    updated_at = NOW();

  UPDATE group_sessions
  SET updated_at = NOW()
  WHERE id = p_group_session_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Mark group read RPC
CREATE OR REPLACE FUNCTION mark_group_read(
  p_group_chat_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authenticated user does not match read user';
  END IF;

  UPDATE group_members
  SET last_read_at = NOW()
  WHERE group_chat_id = p_group_chat_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Enable RLS
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_rsvps ENABLE ROW LEVEL SECURITY;

-- 14. Membership helper for RLS checks
CREATE OR REPLACE FUNCTION is_group_member(
  p_group_chat_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_chat_id = p_group_chat_id
      AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 14. Group chat policies
DROP POLICY IF EXISTS "Users can read own group chats" ON group_chats;
CREATE POLICY "Users can read own group chats" ON group_chats
  FOR SELECT
  USING (is_group_member(group_chats.id));

DROP POLICY IF EXISTS "Users can update own group chats" ON group_chats;
CREATE POLICY "Users can update own group chats" ON group_chats
  FOR UPDATE
  USING (is_group_member(group_chats.id))
  WITH CHECK (is_group_member(group_chats.id));

-- 15. Group member policies
DROP POLICY IF EXISTS "Users can read own group memberships" ON group_members;
CREATE POLICY "Users can read own group memberships" ON group_members
  FOR SELECT
  USING (is_group_member(group_members.group_chat_id));

-- 16. Group message policies
DROP POLICY IF EXISTS "Users can read own group messages" ON group_messages;
CREATE POLICY "Users can read own group messages" ON group_messages
  FOR SELECT
  USING (is_group_member(group_messages.group_chat_id));

DROP POLICY IF EXISTS "Users can insert own group messages" ON group_messages;
CREATE POLICY "Users can insert own group messages" ON group_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND is_group_member(group_messages.group_chat_id)
  );

-- 17. Group session policies
DROP POLICY IF EXISTS "Users can read own group sessions" ON group_sessions;
CREATE POLICY "Users can read own group sessions" ON group_sessions
  FOR SELECT
  USING (is_group_member(group_sessions.group_chat_id));

DROP POLICY IF EXISTS "Users can insert own group sessions" ON group_sessions;
CREATE POLICY "Users can insert own group sessions" ON group_sessions
  FOR INSERT
  WITH CHECK (
    proposed_by = auth.uid()
    AND is_group_member(group_sessions.group_chat_id)
  );

DROP POLICY IF EXISTS "Users can update own group sessions" ON group_sessions;
CREATE POLICY "Users can update own group sessions" ON group_sessions
  FOR UPDATE
  USING (is_group_member(group_sessions.group_chat_id))
  WITH CHECK (is_group_member(group_sessions.group_chat_id));

-- 18. Group session RSVP policies
DROP POLICY IF EXISTS "Users can read own group session RSVPs" ON group_session_rsvps;
CREATE POLICY "Users can read own group session RSVPs" ON group_session_rsvps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM group_sessions gs
      WHERE gs.id = group_session_rsvps.group_session_id
        AND is_group_member(gs.group_chat_id)
    )
  );

-- 19. Add realtime publication entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'group_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'group_sessions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.group_sessions';
  END IF;
END
$$;

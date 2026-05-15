-- Phase 4 Revision 01: Sessions UX Update
-- Run this in the Supabase SQL Editor

-- 1. Update sessions table schema
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS scheduled_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS completed_ack BOOLEAN,
  ADD COLUMN IF NOT EXISTS locked_by_initiator_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by_invitee_at TIMESTAMPTZ;

-- Backfill scheduled_date from session_date where missing
UPDATE sessions
SET scheduled_date = session_date
WHERE scheduled_date IS NULL;

-- 2. Create session_events table for system messages
CREATE TABLE IF NOT EXISTS session_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable RLS on session_events
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own session events" ON session_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = session_events.session_id
        AND sp.user_id = auth.uid()
    )
  );

-- 4. Update create_session to accept scheduled_date and allow multiple pending invites
CREATE OR REPLACE FUNCTION create_session(
  p_match_id UUID,
  p_initiator_id UUID,
  p_scheduled_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
  v_session_id UUID;
  v_invitee_id UUID;
BEGIN
  SELECT user1_id, user2_id INTO v_user1, v_user2
  FROM matches
  WHERE id = p_match_id;

  IF v_user1 IS NULL THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF p_initiator_id <> v_user1 AND p_initiator_id <> v_user2 THEN
    RAISE EXCEPTION 'Initiator is not part of this match';
  END IF;

  v_invitee_id := CASE
    WHEN p_initiator_id = v_user1 THEN v_user2
    ELSE v_user1
  END;

  INSERT INTO sessions (match_id, initiated_by, status, session_date, scheduled_date)
  VALUES (p_match_id, p_initiator_id, 'pending', CURRENT_DATE, p_scheduled_date)
  RETURNING id INTO v_session_id;

  INSERT INTO session_participants (session_id, user_id, role)
  VALUES
    (v_session_id, p_initiator_id, 'initiator'),
    (v_session_id, v_invitee_id, 'invitee');

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update respond_to_session to insert system event on accept
CREATE OR REPLACE FUNCTION respond_to_session(p_session_id UUID, p_user_id UUID, p_response TEXT)
RETURNS VOID AS $$
DECLARE
  v_initiator UUID;
  v_status TEXT;
  v_other_name TEXT;
BEGIN
  SELECT initiated_by, status INTO v_initiator, v_status
  FROM sessions
  WHERE id = p_session_id;

  IF v_initiator IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF p_user_id = v_initiator THEN
    RAISE EXCEPTION 'Initiator cannot respond to session';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Session is not pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_id = p_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant';
  END IF;

  IF p_response = 'accept' THEN
    UPDATE sessions
    SET status = 'active', accepted_at = NOW(), updated_at = NOW()
    WHERE id = p_session_id;

    INSERT INTO session_events (session_id, event_type, message)
    VALUES (p_session_id, 'accepted', '');
  ELSIF p_response = 'decline' THEN
    UPDATE sessions
    SET status = 'declined', updated_at = NOW()
    WHERE id = p_session_id;
  ELSE
    RAISE EXCEPTION 'Invalid response';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add lock-in action (per-user)
CREATE OR REPLACE FUNCTION lock_in_session(p_session_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_role TEXT;
  v_initiator UUID;
  v_invitee UUID;
  v_locked_initiator TIMESTAMPTZ;
  v_locked_invitee TIMESTAMPTZ;
BEGIN
  SELECT role INTO v_role
  FROM session_participants
  WHERE session_id = p_session_id AND user_id = p_user_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'User is not a participant';
  END IF;

  IF v_role = 'initiator' THEN
    UPDATE sessions
    SET locked_by_initiator_at = COALESCE(locked_by_initiator_at, NOW()),
        updated_at = NOW()
    WHERE id = p_session_id
    RETURNING locked_by_initiator_at, locked_by_invitee_at
    INTO v_locked_initiator, v_locked_invitee;
  ELSE
    UPDATE sessions
    SET locked_by_invitee_at = COALESCE(locked_by_invitee_at, NOW()),
        updated_at = NOW()
    WHERE id = p_session_id
    RETURNING locked_by_initiator_at, locked_by_invitee_at
    INTO v_locked_initiator, v_locked_invitee;
  END IF;

  IF v_locked_initiator IS NOT NULL AND v_locked_invitee IS NOT NULL THEN
    UPDATE sessions
    SET status = 'completed',
        completed_ack = TRUE,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Auto-cancel sessions not fully locked after 24 hours
CREATE OR REPLACE FUNCTION auto_cancel_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE sessions
  SET status = 'cancelled',
      completed_ack = FALSE,
      locked_by_initiator_at = NULL,
      locked_by_invitee_at = NULL,
      updated_at = NOW()
  WHERE status = 'active'
    AND accepted_at < NOW() - INTERVAL '24 hours'
    AND (locked_by_initiator_at IS NULL OR locked_by_invitee_at IS NULL);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Keep auto_complete_sessions for backward compatibility (delegates to auto_cancel_sessions)
CREATE OR REPLACE FUNCTION auto_complete_sessions()
RETURNS INTEGER AS $$
  SELECT auto_cancel_sessions();
$$ LANGUAGE sql SECURITY DEFINER;

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_date ON sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sessions_accepted_at ON sessions(accepted_at);
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_created_at ON session_events(created_at);

-- 10. Add session_events to realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'session_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.session_events';
  END IF;
END
$$;

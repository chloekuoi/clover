-- Phase 4: Sessions Database Setup
-- Run this in the Supabase SQL Editor

-- 1. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  initiated_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'declined', 'completed', 'cancelled')),
  session_date DATE DEFAULT CURRENT_DATE NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create session_participants table
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('initiator', 'invitee')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, user_id)
);

-- 3. Create session creation function (one active/pending per user)
CREATE OR REPLACE FUNCTION create_session(p_match_id UUID, p_initiator_id UUID)
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

  IF EXISTS (
    SELECT 1
    FROM session_participants sp
    JOIN sessions s ON s.id = sp.session_id
    WHERE sp.user_id IN (v_user1, v_user2)
      AND s.status IN ('pending', 'active')
  ) THEN
    RAISE EXCEPTION 'User already has an active or pending session';
  END IF;

  v_invitee_id := CASE
    WHEN p_initiator_id = v_user1 THEN v_user2
    ELSE v_user1
  END;

  INSERT INTO sessions (match_id, initiated_by, status, session_date)
  VALUES (p_match_id, p_initiator_id, 'pending', CURRENT_DATE)
  RETURNING id INTO v_session_id;

  INSERT INTO session_participants (session_id, user_id, role)
  VALUES
    (v_session_id, p_initiator_id, 'initiator'),
    (v_session_id, v_invitee_id, 'invitee');

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Respond to session (accept/decline)
CREATE OR REPLACE FUNCTION respond_to_session(p_session_id UUID, p_user_id UUID, p_response TEXT)
RETURNS VOID AS $$
DECLARE
  v_initiator UUID;
  v_status TEXT;
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
  ELSIF p_response = 'decline' THEN
    UPDATE sessions
    SET status = 'declined', updated_at = NOW()
    WHERE id = p_session_id;
  ELSE
    RAISE EXCEPTION 'Invalid response';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Complete session (manual end)
CREATE OR REPLACE FUNCTION complete_session(p_session_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_id = p_session_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant';
  END IF;

  UPDATE sessions
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_session_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not active or not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Cancel session (initiator only, pending only)
CREATE OR REPLACE FUNCTION cancel_session(p_session_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_initiator UUID;
  v_status TEXT;
BEGIN
  SELECT initiated_by, status INTO v_initiator, v_status
  FROM sessions
  WHERE id = p_session_id;

  IF v_initiator IS NULL THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF p_user_id <> v_initiator THEN
    RAISE EXCEPTION 'Only the initiator can cancel';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Session is not pending';
  END IF;

  UPDATE sessions
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Auto-complete stale sessions
CREATE OR REPLACE FUNCTION auto_complete_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE sessions
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE status = 'active'
    AND session_date < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable RLS on sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions" ON sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = sessions.id
        AND sp.user_id = auth.uid()
    )
  );

-- 9. Enable RLS on session_participants
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own session participants" ON session_participants
  FOR SELECT
  USING (user_id = auth.uid());

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_match_id ON sessions(match_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);

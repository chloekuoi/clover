-- Phase 10: Co-work invites + push tokens
-- Run this in the Supabase SQL Editor

-- 1. co_work_invites table
CREATE TABLE IF NOT EXISTS co_work_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- One invite per pair per day (in either direction)
CREATE UNIQUE INDEX IF NOT EXISTS co_work_invites_pair_day
  ON co_work_invites (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), expires_at);

CREATE INDEX IF NOT EXISTS idx_co_work_invites_receiver ON co_work_invites(receiver_id);
CREATE INDEX IF NOT EXISTS idx_co_work_invites_sender ON co_work_invites(sender_id);

ALTER TABLE co_work_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert own invites" ON co_work_invites
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "read own invites" ON co_work_invites
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Status updates happen only through respond_to_invite (SECURITY DEFINER); no UPDATE policy.

-- 2. push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage own push token" ON push_tokens
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. respond_to_invite RPC — accept creates a match, returns its id
CREATE OR REPLACE FUNCTION respond_to_invite(invite_id UUID, response TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite co_work_invites;
  v_match_id UUID;
BEGIN
  IF response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'invalid response';
  END IF;

  SELECT * INTO v_invite FROM co_work_invites
  WHERE id = invite_id AND receiver_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found';
  END IF;

  UPDATE co_work_invites SET status = response WHERE id = invite_id;

  IF response = 'accepted' THEN
    v_match_id := create_match(v_invite.sender_id, v_invite.receiver_id);
    RETURN json_build_object('match_id', v_match_id);
  END IF;

  RETURN json_build_object('match_id', NULL);
END;
$$;

-- Phase 9: Contact sync support
-- Adds phone_number_hash column for privacy-preserving contact matching

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_phone_hash ON profiles(phone_number_hash);

-- RPC: find users on the app from a list of hashed phone numbers
CREATE OR REPLACE FUNCTION find_contacts_on_app(hashed_phones text[])
RETURNS TABLE(user_id uuid, name text, phone_number_hash text) AS $$
  SELECT id AS user_id, name, phone_number_hash
  FROM profiles
  WHERE phone_number_hash = ANY(hashed_phones)
    AND onboarding_complete = true;
$$ LANGUAGE sql SECURITY DEFINER;

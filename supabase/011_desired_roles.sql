-- supabase/011_desired_roles.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS desired_roles TEXT;

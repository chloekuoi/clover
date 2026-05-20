-- Phase 1: Profiles Table
-- NOTE: This was originally created via Supabase Dashboard (clickops)
-- This file documents the expected schema for reproducibility

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT NOT NULL UNIQUE,
  name TEXT,
  photo_url TEXT,
  work_type TEXT,
  interests TEXT[],
  bio TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Anyone can view profiles (needed for discovery)
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    'user_' || REPLACE(NEW.id::TEXT, '-', ''),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

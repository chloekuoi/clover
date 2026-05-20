-- Phase 5: Profile Photos + Extended Profile Fields
-- Run this in the Supabase SQL Editor

-- 1) Extend profiles with Phase 5 fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS currently_working_on TEXT,
  ADD COLUMN IF NOT EXISTS work TEXT,
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

-- 2) Create profile_photos table
CREATE TABLE IF NOT EXISTS profile_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 4),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, position)
);

CREATE INDEX IF NOT EXISTS idx_profile_photos_user
  ON profile_photos (user_id);

CREATE INDEX IF NOT EXISTS idx_profile_photos_user_position
  ON profile_photos (user_id, position);

-- 3) Enable RLS and policies on profile_photos
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view profile photos" ON profile_photos;
CREATE POLICY "Anyone can view profile photos" ON profile_photos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own photos" ON profile_photos;
CREATE POLICY "Users can insert own photos" ON profile_photos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own photos" ON profile_photos;
CREATE POLICY "Users can update own photos" ON profile_photos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own photos" ON profile_photos;
CREATE POLICY "Users can delete own photos" ON profile_photos
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Ensure avatars storage bucket exists and has required config
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE id = 'avatars';

-- 5) Storage object policies for avatars bucket
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

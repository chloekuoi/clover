-- Phase 2: Discovery Feature Database Setup
-- Run this in the Supabase SQL Editor

-- 1. Create work_intents table
CREATE TABLE IF NOT EXISTS work_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  task_description TEXT NOT NULL,
  available_from TIME NOT NULL,
  available_until TIME NOT NULL,
  work_style TEXT NOT NULL,
  location_type TEXT NOT NULL,
  location_name TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  intent_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, intent_date)
);

-- 2. Create swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swiper_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  swiped_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('right', 'left')),
  swipe_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(swiper_id, swiped_id, swipe_date)
);

-- 3. Create check_match function
CREATE OR REPLACE FUNCTION check_match(p_swiper_id UUID, p_swiped_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM swipes
    WHERE swiper_id = p_swiped_id
    AND swiped_id = p_swiper_id
    AND direction = 'right'
    AND swipe_date = CURRENT_DATE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Enable RLS on work_intents
ALTER TABLE work_intents ENABLE ROW LEVEL SECURITY;

-- Users can read all intents (for discovery)
CREATE POLICY "Users can read all intents" ON work_intents
  FOR SELECT
  USING (true);

-- Users can insert their own intents
CREATE POLICY "Users can insert own intents" ON work_intents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own intents
CREATE POLICY "Users can update own intents" ON work_intents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own intents
CREATE POLICY "Users can delete own intents" ON work_intents
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Enable RLS on swipes
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Users can read swipes where they are the swiper or swiped
DROP POLICY IF EXISTS "Users can read own swipes" ON swipes;
CREATE POLICY "Users can read own swipes" ON swipes
  FOR SELECT
  USING (auth.uid() = swiper_id OR auth.uid() = swiped_id);

-- Users can insert their own swipes
CREATE POLICY "Users can insert own swipes" ON swipes
  FOR INSERT
  WITH CHECK (auth.uid() = swiper_id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_intents_date ON work_intents(intent_date);
CREATE INDEX IF NOT EXISTS idx_work_intents_user_date ON work_intents(user_id, intent_date);
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_date ON swipes(swiper_id, swipe_date);
CREATE INDEX IF NOT EXISTS idx_swipes_match_check ON swipes(swiper_id, swiped_id, direction, swipe_date);

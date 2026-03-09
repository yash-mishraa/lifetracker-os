-- LifeOS Tracker: Weekly Review Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Qualitative Reflection
  went_well TEXT,
  could_improve TEXT,
  biggest_achievement TEXT,
  habits_maintained TEXT,
  habits_missed TEXT,
  
  -- Quantitative Snapshot
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  user_id UUID REFERENCES auth.users NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- A user should only have 1 review per week period
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS for weekly reviews
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own weekly reviews" ON weekly_reviews FOR ALL USING (auth.uid() = user_id);

-- Index for ordering chronologically
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_id ON weekly_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_start_date ON weekly_reviews(week_start_date DESC);

-- LifeOS Tracker: Health Tracking Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS health_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  sleep_hours NUMERIC(4,1) DEFAULT 0,
  water_intake INTEGER DEFAULT 0,
  weight NUMERIC(5,1) DEFAULT NULL,
  steps INTEGER DEFAULT 0,
  calories INTEGER DEFAULT 0,
  workout_done BOOLEAN DEFAULT false,
  workout_details TEXT,
  mood TEXT CHECK (mood IN ('Very happy', 'Happy', 'Neutral', 'Stressed', 'Sad')),
  notes TEXT,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date) -- Only one comprehensive health log per day per user
);

-- Enable RLS for health_logs
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own health logs" ON health_logs FOR ALL USING (auth.uid() = user_id);

-- Index for fast date range queries
CREATE INDEX IF NOT EXISTS idx_health_logs_user_id ON health_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_date ON health_logs(date);

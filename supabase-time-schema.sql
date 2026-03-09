-- LifeOS Tracker: Time Tracking Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- allow tracking without a specific task
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL,
  timer_type TEXT CHECK (timer_type IN ('Pomodoro', 'Manual')) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for time_logs
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own time logs" ON time_logs FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance (especially querying by user, task or date ranges)
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);

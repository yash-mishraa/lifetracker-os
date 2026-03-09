export type TimerType = 'Pomodoro' | 'Manual';

export interface TimeLog {
  id: string;
  task_id?: string | null;
  start_time: string; // ISO DB string
  end_time: string;   // ISO DB string
  duration_seconds: number;
  timer_type: TimerType;
  created_at?: string;
}

export interface PomodoroSettings {
  focusTime: number; // in minutes
  breakTime: number; // in minutes
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusTime: 25,
  breakTime: 5,
};

export interface TimeLogFormData {
  task_id?: string | null;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
  timer_type: TimerType;
}

// Helper types for the dashboard
export interface ProjectTimeStats {
  project_id: string;
  project_name: string;
  total_seconds: number;
}

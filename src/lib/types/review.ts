export interface WeeklyReviewMetrics {
  tasks_completed: number;
  habits_completed: number;
  average_sleep: number; // in hours
  total_focus_hours: number;
}

export interface WeeklyReview {
  id: string;
  week_start_date: string; // YYYY-MM-DD
  week_end_date: string;   // YYYY-MM-DD
  went_well?: string;
  could_improve?: string;
  biggest_achievement?: string;
  habits_maintained?: string;
  habits_missed?: string;
  metrics: WeeklyReviewMetrics;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyReviewFormData {
  went_well: string;
  could_improve: string;
  biggest_achievement: string;
  habits_maintained: string;
  habits_missed: string;
}

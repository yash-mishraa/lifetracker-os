export interface DailyCompletion {
  date: string; // yyyy-MM-dd
  completionRate: number; // 0-100
  totalCompleted: number;
  totalScheduled: number;
}

export interface HabitAnalyticsData {
  successRate: number;        // Overall percentage (0-100)
  failurePattern: string;     // e.g., "You miss mostly on Mondays"
  streakPrediction: string;   // e.g., "5 more days to break your record"
  
  // Data for visual charts
  heatmapData: DailyCompletion[];
  consistencyData: DailyCompletion[];
}

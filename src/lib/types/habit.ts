// ---- Enums / Unions ----

export type HabitType = "binary" | "quantitative";
export type HabitFrequency = "daily" | "weekdays" | "custom";

export const HABIT_CATEGORIES = [
  "Health & Fitness",
  "Productivity",
  "Learning",
  "Finance",
  "Mindfulness",
  "Other",
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

// ---- Models ----

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  category: HabitCategory | string;
  frequency_type: HabitFrequency;
  frequency_days: number[]; // For weekdays: 0=Sun..6=Sat. For custom: [numberOfDaysPerWeek]
  reminder_time: string | null; // HH:mm format
  target_value: number; // e.g., 8 for "8 glasses of water"
  notes: string;
  color: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value: number;
  created_at?: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage 0-100 (last 30 days)
  totalCompletions: number;
}

export interface HabitFormData {
  name: string;
  type: HabitType;
  category: string;
  frequency_type: HabitFrequency;
  frequency_days: number[];
  reminder_time: string;
  target_value: number;
  notes: string;
  color: string;
}

export const DEFAULT_HABIT_FORM: HabitFormData = {
  name: "",
  type: "binary",
  category: "Health & Fitness",
  frequency_type: "daily",
  frequency_days: [],
  reminder_time: "",
  target_value: 1,
  notes: "",
  color: "#6366f1", // Indigo
};

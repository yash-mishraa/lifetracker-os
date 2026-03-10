//health.ts
export const MOOD_OPTIONS = ["Very happy", "Happy", "Neutral", "Stressed", "Sad"] as const;

export type MoodOption = typeof MOOD_OPTIONS[number];

export interface HealthLog {
  id: string;
  date: string; // YYYY-MM-DD
  sleep_hours: number;
  water_intake: number; // e.g., in ml or glasses
  weight: number | null;
  steps: number;
  calories: number;
  workout_done: boolean;
  workout_details: string;
  mood: MoodOption | string | null;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface HealthFormData {
  date: string;
  sleep_hours: number;
  water_intake: number;
  weight: number | "";
  steps: number;
  calories: number;
  workout_done: boolean;
  workout_details: string;
  mood: string;
  notes: string;
}

export const DEFAULT_HEALTH_FORM: HealthFormData = {
  date: new Date().toISOString().split("T")[0],
  sleep_hours: 0,
  water_intake: 0,
  weight: "",
  steps: 0,
  calories: 0,
  workout_done: false,
  workout_details: "",
  mood: "",
  notes: "",
};

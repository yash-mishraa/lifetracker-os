// ---- Types ----

export type RoutineType = "morning" | "night" | "other";

export interface Routine {
  id: string;
  title: string;
  type: RoutineType;
  created_at: string;
}

export interface RoutineStep {
  id: string;
  routine_id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface RoutineLog {
  id: string;
  routine_id: string;
  date: string; // YYYY-MM-DD
  completed_step_ids: string[];
  is_completed: boolean; // True if all steps for that routine were checked off
}

export interface RoutineStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number; // percentage based on last 30 days
}

export interface RoutineFormData {
  title: string;
  type: RoutineType;
}

export const DEFAULT_ROUTINE_FORM: RoutineFormData = {
  title: "",
  type: "morning",
};

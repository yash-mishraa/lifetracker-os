import { LucideIcon } from "lucide-react";

export type PersonalRecordType =
  | "longest_habit_streak"
  | "most_focus_hours"
  | "most_tasks_completed"
  | "best_discipline_score";

export interface PersonalRecord {
  id: PersonalRecordType;
  title: string;
  value: number;
  unit: string;
  date_achieved: string | null;
  description: string;
  // If the record is tied to a specific item (e.g., longest streak for "Exercise")
  related_item_name?: string; 
}

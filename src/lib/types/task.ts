// ---- Enums / Unions ----

export type Priority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "completed" | "blocked";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";

// ---- Data Models ----

export interface Project {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null;
  estimated_minutes: number;
  tags: string[];
  project_id: string | null;
  parent_task_id: string | null;
  recurrence: Recurrence;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  position: number;
  // Joined / computed
  project?: Project | null;
  subtasks?: Task[];
}

// ---- Form Data ----

export interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
  estimated_minutes: number;
  tags: string[];
  project_id: string;
  parent_task_id: string;
  recurrence: Recurrence;
}

// ---- Filters ----

export interface TaskFilter {
  priority: Priority | "all";
  status: TaskStatus | "all";
  project_id: string | "all";
  tag: string | "all";
  search: string;
}

// ---- Constants ----

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  low: { label: "Low", color: "text-slate-400", bgColor: "bg-slate-400/10", dotColor: "bg-slate-400" },
  medium: { label: "Medium", color: "text-blue-400", bgColor: "bg-blue-400/10", dotColor: "bg-blue-400" },
  high: { label: "High", color: "text-amber-400", bgColor: "bg-amber-400/10", dotColor: "bg-amber-400" },
  critical: { label: "Critical", color: "text-red-400", bgColor: "bg-red-400/10", dotColor: "bg-red-400" },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string }
> = {
  todo: { label: "To Do", color: "text-slate-400", bgColor: "bg-slate-400/10" },
  in_progress: { label: "In Progress", color: "text-blue-400", bgColor: "bg-blue-400/10" },
  completed: { label: "Completed", color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  blocked: { label: "Blocked", color: "text-red-400", bgColor: "bg-red-400/10" },
};

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const DEFAULT_TASK_FORM: TaskFormData = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  deadline: "",
  estimated_minutes: 0,
  tags: [],
  project_id: "",
  parent_task_id: "",
  recurrence: "none",
};

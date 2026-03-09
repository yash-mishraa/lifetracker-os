export type GoalCategory = 'Career' | 'Health' | 'Learning' | 'Finance' | 'Personal';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  target_date?: string; // stored as ISO Date string (YYYY-MM-DD)
  created_at?: string;
  updated_at?: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  created_at?: string;
}

export interface GoalWithMilestones extends Goal {
  milestones: Milestone[];
}

export interface GoalFormData {
  title: string;
  description: string;
  category: GoalCategory;
  target_date: Date | undefined;
}

export const DEFAULT_GOAL_FORM: GoalFormData = {
  title: "",
  description: "",
  category: "Personal",
  target_date: undefined,
};

export interface MilestoneFormData {
  title: string;
  description: string;
}

export const DEFAULT_MILESTONE_FORM: MilestoneFormData = {
  title: "",
  description: "",
};

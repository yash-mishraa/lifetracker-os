import { supabase, isSupabaseConfigured } from '../supabase';
import { Goal, Milestone, GoalWithMilestones, GoalFormData, MilestoneFormData } from '../types/goal';

const GOALS_STORAGE_KEY = 'lifeos_goals';
const MILESTONES_STORAGE_KEY = 'lifeos_milestones';

// Helper for generating local IDs if needed
function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
}

// ---------------------------------------------------------------------------
// GOALS
// ---------------------------------------------------------------------------

export async function getGoals(): Promise<GoalWithMilestones[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to access goals.");

  // 1. Fetch all goals for the logged in user
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', session.user.id)
    .order('target_date', { ascending: true, nullsFirst: false });
    
  if (goalsError) {
    console.error("Supabase getGoals error:", goalsError);
    throw new Error(goalsError.message);
  }
  
  // 2. Fetch all milestones (Row Level Security ensures we only get ours)
  const { data: milestones, error: msError } = await supabase
    .from('milestones')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (msError) {
    console.error("Supabase getMilestones error:", msError);
  }
  
  const allMilestones = (milestones as Milestone[]) || [];
  
  // 3. Map together
  return (goals as Goal[]).map(goal => ({
    ...goal,
    milestones: allMilestones.filter(m => m.goal_id === goal.id)
  }));
}

export async function createGoal(formData: GoalFormData): Promise<Goal> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to create goals.");

  const goalModel: Partial<Goal> = {
    title: formData.title,
    description: formData.description || null as any,
    category: formData.category,
    target_date: formData.target_date ? formData.target_date.toISOString().split('T')[0] : null as any
  };

  const insertData = { ...goalModel, user_id: session.user.id };

  const { data, error } = await supabase
    .from('goals')
    .insert([insertData])
    .select()
    .single();
    
  if (error) {
    console.error("Supabase createGoal error:", error);
    throw new Error(error.message);
  }
  return data as Goal;
}

export async function updateGoal(id: string, formData: GoalFormData): Promise<Goal> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to update goals.");

  const updates: Partial<Goal> = {
    title: formData.title,
    description: formData.description || null as any,
    category: formData.category,
    target_date: formData.target_date ? formData.target_date.toISOString().split('T')[0] : null as any,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', session.user.id) // Security: ensure it belongs to them
    .select()
    .single();
    
  if (error) {
    console.error("Supabase updateGoal error:", error);
    throw new Error(error.message);
  }
  return data as Goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to delete goals.");

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);
    
  if (error) {
    console.error("Supabase deleteGoal error:", error);
    throw new Error(error.message);
  }
  // Supabase handles cascading delete for milestones
}
// ---------------------------------------------------------------------------
// MILESTONES
// ---------------------------------------------------------------------------

export async function addMilestone(goalId: string, formData: MilestoneFormData): Promise<Milestone> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to add milestones.");

  const msModel: Partial<Milestone> = {
    goal_id: goalId,
    title: formData.title,
    description: formData.description || null as any,
    is_completed: false
  };

  const insertData = { ...msModel, user_id: session.user.id };

  const { data, error } = await supabase
    .from('milestones')
    .insert([insertData])
    .select()
    .single();
    
  if (error) {
    console.error("Supabase addMilestone error:", error);
    throw new Error(error.message);
  }
  return data as Milestone;
}

export async function updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to update milestones.");

  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error("Supabase updateMilestone error:", error);
    throw new Error(error.message);
  }
  return data as Milestone;
}

export async function deleteMilestone(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to delete milestones.");

  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error("Supabase deleteMilestone error:", error);
    throw new Error(error.message);
  }
}

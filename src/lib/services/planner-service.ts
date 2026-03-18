import { supabase } from '../supabase';
import { Goal, Milestone, GoalWithMilestones, GoalFormData, MilestoneFormData } from '../types/goal';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function getGoals(): Promise<GoalWithMilestones[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to access goals.");

  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', session.user.id)
    .order('target_date', { ascending: true, nullsFirst: false });
  if (goalsError) throw new Error(goalsError.message);

  // ✅ FIXED: filter milestones by user_id, not relying on RLS alone
  const { data: milestones, error: msError } = await supabase
    .from('milestones')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true });
  if (msError) console.error("Supabase getMilestones error:", msError);

  const allMilestones = (milestones as Milestone[]) || [];

  return (goals as Goal[]).map(goal => ({
    ...goal,
    milestones: allMilestones.filter(m => m.goal_id === goal.id)
  }));
}

export async function createGoal(formData: GoalFormData): Promise<Goal> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to create goals.");

  const { data, error } = await supabase
    .from('goals')
    .insert([{
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      target_date: formData.target_date ? formData.target_date.toISOString().split('T')[0] : null,
      user_id: session.user.id,
    }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Goal;
}

export async function updateGoal(id: string, formData: GoalFormData): Promise<Goal> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to update goals.");

  const { data, error } = await supabase
    .from('goals')
    .update({
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      target_date: formData.target_date ? formData.target_date.toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
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
  if (error) throw new Error(error.message);
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function addMilestone(goalId: string, formData: MilestoneFormData): Promise<Milestone> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to add milestones.");

  const { data, error } = await supabase
    .from('milestones')
    .insert([{
      goal_id: goalId,
      title: formData.title,
      description: formData.description || null,
      is_completed: false,
      user_id: session.user.id,
    }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Milestone;
}

export async function updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to update milestones.");

  // ✅ FIXED: added .eq('user_id') so users can't update other users' milestones
  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Milestone;
}

export async function deleteMilestone(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to delete milestones.");

  // ✅ FIXED: added .eq('user_id') safety check
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);
  if (error) throw new Error(error.message);
}
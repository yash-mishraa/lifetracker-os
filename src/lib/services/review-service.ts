import { supabase, isSupabaseConfigured } from '../supabase';
import { WeeklyReview, WeeklyReviewFormData, WeeklyReviewMetrics } from '../types/review';
import { getTasks } from './task-service';
import { getHabitLogs } from './habit-service';
import { getHealthLogs } from './health-service';
import { getTimeLogs } from './time-service';
import { startOfWeek, endOfWeek, parseISO, format } from 'date-fns';

const WEEKLY_REVIEWS_STORAGE_KEY = 'lifeos_weekly_reviews';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
}

// ---------------------------------------------------------------------------
// METRICS SNAPSHOT AGGREGATOR
// ---------------------------------------------------------------------------

/**
 * Calculates the exact metrics needed for the weekly review snapshot
 * for the given week (defined by a date inside that week).
 */
export async function getWeeklyMetricsSnapshot(dateInWeek: Date = new Date()): Promise<WeeklyReviewMetrics> {
  const start = startOfWeek(dateInWeek, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(dateInWeek, { weekStartsOn: 1 });     // Sunday
  
  const [tasks, habitLogs, healthLogs, timeLogs] = await Promise.all([
    getTasks(),
    getHabitLogs(), // Assuming this fetches all, filtering locally
    getHealthLogs(),
    getTimeLogs(start, end)
  ]);

  // Tasks Completed (only those updated/completed within this week)
  const tasksCompleted = tasks.filter(t => {
    if (t.status !== 'completed' || !t.updated_at) return false;
    const d = parseISO(t.updated_at);
    return d >= start && d <= end;
  }).length;

  // Habits Completed (logs falling in this week)
  const habitsCompleted = habitLogs.filter(l => {
    const d = parseISO(l.date);
    return d >= start && d <= end && l.completed;
  }).length;

  // Average Sleep
  let totalSleep = 0;
  let sleepCount = 0;
  healthLogs.forEach(l => {
    const d = parseISO(l.date);
    if (d >= start && d <= end && l.sleep_hours && l.sleep_hours > 0) {
      totalSleep += l.sleep_hours;
      sleepCount++;
    }
  });
  const average_sleep = sleepCount > 0 ? Number((totalSleep / sleepCount).toFixed(1)) : 0;

  // Total Focus Hours
  const totalFocusSecs = timeLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
  const total_focus_hours = Number((totalFocusSecs / 3600).toFixed(1));

  return {
    tasks_completed: tasksCompleted,
    habits_completed: habitsCompleted,
    average_sleep,
    total_focus_hours
  };
}


// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .order('week_start_date', { ascending: false });
    
    if (error) {
      console.error("Supabase getWeeklyReviews error:", error);
      throw new Error(error.message);
    }
    return data as WeeklyReview[];
  }

  // --- LOCAL STORAGE FALLBACK ---
  try {
    const raw = localStorage.getItem(WEEKLY_REVIEWS_STORAGE_KEY);
    const reviews: WeeklyReview[] = raw ? JSON.parse(raw) : [];
    return reviews.sort((a, b) => new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime());
  } catch (error) {
    console.error("Local storage error:", error);
    return [];
  }
}

export async function getReviewForWeek(dateInWeek: Date): Promise<WeeklyReview | null> {
  const start = startOfWeek(dateInWeek, { weekStartsOn: 1 });
  const startStr = format(start, 'yyyy-MM-dd');

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('week_start_date', startStr)
      .maybeSingle(); // maybeSingle because it might not exist yet
      
    if (error) {
      console.error("Supabase getReviewForWeek error:", error);
      return null;
    }
    return data as WeeklyReview | null;
  }

  // --- LOCAL STORAGE ---
  const all = await getWeeklyReviews();
  return all.find(r => r.week_start_date === startStr) || null;
}

export async function saveWeeklyReview(
  formData: WeeklyReviewFormData, 
  metrics: WeeklyReviewMetrics, 
  dateInWeek: Date = new Date()
): Promise<WeeklyReview> {
  
  const start = startOfWeek(dateInWeek, { weekStartsOn: 1 });
  const end = endOfWeek(dateInWeek, { weekStartsOn: 1 });
  
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  // Check if it already exists to determine insert vs update
  const existing = await getReviewForWeek(dateInWeek);

  const model: Partial<WeeklyReview> = {
    week_start_date: startStr,
    week_end_date: endStr,
    went_well: formData.went_well,
    could_improve: formData.could_improve,
    biggest_achievement: formData.biggest_achievement,
    habits_maintained: formData.habits_maintained,
    habits_missed: formData.habits_missed,
    metrics: metrics,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    if (existing) {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .update(model)
        .eq('id', existing.id)
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data as WeeklyReview;
    } else {
      model.created_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('weekly_reviews')
        .insert([model])
        .select()
        .single();
        
      if (error) throw new Error(error.message);
      return data as WeeklyReview;
    }
  }

  // --- LOCAL STORAGE FALLBACK ---
  const allRaw = localStorage.getItem(WEEKLY_REVIEWS_STORAGE_KEY);
  const all: WeeklyReview[] = allRaw ? JSON.parse(allRaw) : [];

  if (existing) {
    const updated = { ...existing, ...model } as WeeklyReview;
    const neArray = all.map(r => r.id === existing.id ? updated : r);
    localStorage.setItem(WEEKLY_REVIEWS_STORAGE_KEY, JSON.stringify(neArray));
    return updated;
  } else {
    const newReview = { id: generateId(), created_at: new Date().toISOString(), ...model } as WeeklyReview;
    localStorage.setItem(WEEKLY_REVIEWS_STORAGE_KEY, JSON.stringify([newReview, ...all]));
    return newReview;
  }
}

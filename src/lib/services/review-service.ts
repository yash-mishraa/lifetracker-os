import { supabase, isSupabaseConfigured } from "../supabase";
import { WeeklyReview, WeeklyReviewFormData, WeeklyReviewMetrics } from "../types/review";
import { getTasks } from "./task-service";
import { getHabitLogs } from "./habit-service";
import { getHealthLogs } from "./health-service";
import { getTimeLogs } from "./time-service";
import { startOfWeek, endOfWeek, parseISO, format } from "date-fns";

async function getStorageKey(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? "anonymous";
    return `lifeos_weekly_reviews_${uid}`;
  } catch { return "lifeos_weekly_reviews_anonymous"; }
}

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

export async function getWeeklyMetricsSnapshot(dateInWeek: Date = new Date()): Promise<WeeklyReviewMetrics> {
  const start = startOfWeek(dateInWeek, { weekStartsOn: 1 });
  const end = endOfWeek(dateInWeek, { weekStartsOn: 1 });
  const [tasks, habitLogs, healthLogs, timeLogs] = await Promise.all([getTasks(), getHabitLogs(), getHealthLogs(), getTimeLogs(start, end)]);
  const tasksCompleted = tasks.filter(t => { if (t.status !== "completed" || !t.updated_at) return false; const d = parseISO(t.updated_at); return d >= start && d <= end; }).length;
  const habitsCompleted = habitLogs.filter(l => { const d = parseISO(l.date); return d >= start && d <= end && l.completed; }).length;
  let totalSleep = 0; let sleepCount = 0;
  healthLogs.forEach(l => { const d = parseISO(l.date); if (d >= start && d <= end && l.sleep_hours && l.sleep_hours > 0) { totalSleep += l.sleep_hours; sleepCount++; } });
  return {
    tasks_completed: tasksCompleted,
    habits_completed: habitsCompleted,
    average_sleep: sleepCount > 0 ? Number((totalSleep / sleepCount).toFixed(1)) : 0,
    total_focus_hours: Number((timeLogs.reduce((s, l) => s + l.duration_seconds, 0) / 3600).toFixed(1)),
  };
}

export async function getWeeklyReviews(): Promise<WeeklyReview[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error("Not authenticated");
    const { data, error } = await supabase.from("weekly_reviews").select("*").eq("user_id", session.user.id).order("week_start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data as WeeklyReview[];
  }
  try {
    const key = await getStorageKey();
    const raw = localStorage.getItem(key);
    const reviews: WeeklyReview[] = raw ? JSON.parse(raw) : [];
    return reviews.sort((a, b) => new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime());
  } catch { return []; }
}

export async function getReviewForWeek(dateInWeek: Date): Promise<WeeklyReview | null> {
  const startStr = format(startOfWeek(dateInWeek, { weekStartsOn: 1 }), "yyyy-MM-dd");
  if (isSupabaseConfigured() && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;
    const { data, error } = await supabase.from("weekly_reviews").select("*").eq("user_id", session.user.id).eq("week_start_date", startStr).maybeSingle();
    if (error) return null;
    return data as WeeklyReview | null;
  }
  const all = await getWeeklyReviews();
  return all.find(r => r.week_start_date === startStr) || null;
}

export async function saveWeeklyReview(formData: WeeklyReviewFormData, metrics: WeeklyReviewMetrics, dateInWeek: Date = new Date()): Promise<WeeklyReview> {
  const start = startOfWeek(dateInWeek, { weekStartsOn: 1 });
  const end = endOfWeek(dateInWeek, { weekStartsOn: 1 });
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");
  const existing = await getReviewForWeek(dateInWeek);
  const model: Partial<WeeklyReview> = { week_start_date: startStr, week_end_date: endStr, went_well: formData.went_well, could_improve: formData.could_improve, biggest_achievement: formData.biggest_achievement, habits_maintained: formData.habits_maintained, habits_missed: formData.habits_missed, metrics, updated_at: new Date().toISOString() };
  if (isSupabaseConfigured() && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error("Not authenticated");
    if (existing) {
      const { data, error } = await supabase.from("weekly_reviews").update(model).eq("id", existing.id).eq("user_id", session.user.id).select().single();
      if (error) throw new Error(error.message);
      return data as WeeklyReview;
    } else {
      const { data, error } = await supabase.from("weekly_reviews").insert([{ ...model, user_id: session.user.id, created_at: new Date().toISOString() }]).select().single();
      if (error) throw new Error(error.message);
      return data as WeeklyReview;
    }
  }
  const key = await getStorageKey();
  const allRaw = localStorage.getItem(key);
  const all: WeeklyReview[] = allRaw ? JSON.parse(allRaw) : [];
  if (existing) {
    const updated = { ...existing, ...model } as WeeklyReview;
    localStorage.setItem(key, JSON.stringify(all.map(r => r.id === existing.id ? updated : r)));
    return updated;
  }
  const newReview = { id: generateId(), created_at: new Date().toISOString(), ...model } as WeeklyReview;
  localStorage.setItem(key, JSON.stringify([newReview, ...all]));
  return newReview;
}
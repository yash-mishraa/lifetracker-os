import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { HealthLog, HealthFormData } from "@/lib/types/health";

// ── User-scoped localStorage key ─────────────────────────────────────────────
async function getStorageKey(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? "anonymous";
    return `lifeos_health_logs_${uid}`;
  } catch {
    return "lifeos_health_logs_anonymous";
  }
}

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function getLocalHealthLogs(): Promise<HealthLog[]> {
  if (typeof window === "undefined") return [];
  const key = await getStorageKey();
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

async function setLocalHealthLogs(logs: HealthLog[]) {
  const key = await getStorageKey();
  localStorage.setItem(key, JSON.stringify(logs));
}

export async function getHealthLogs(startDate?: string, endDate?: string): Promise<HealthLog[]> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error("Not authenticated");

    let query = supabase
      .from("health_logs")
      .select("*")
      .eq("user_id", session.user.id)
      .order("date", { ascending: true });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  let logs = await getLocalHealthLogs();
  if (startDate) logs = logs.filter(l => l.date >= startDate);
  if (endDate) logs = logs.filter(l => l.date <= endDate);
  return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getHealthLogByDate(date: string): Promise<HealthLog | null> {
  const logs = await getHealthLogs(date, date);
  return logs.length > 0 ? logs[0] : null;
}

export async function upsertHealthLog(data: HealthFormData): Promise<HealthLog> {
  const now = new Date().toISOString();
  const weightVal = data.weight === "" ? null : Number(data.weight);
  const moodVal = data.mood === "" ? null : data.mood;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    user_id: user.id,
    date: data.date,
    sleep_hours: Number(data.sleep_hours) || 0,
    water_intake: Number(data.water_intake) || 0,
    weight: weightVal,
    steps: Number(data.steps) || 0,
    calories: Number(data.calories) || 0,
    workout_done: data.workout_done,
    workout_details: data.workout_details || "",
    mood: moodVal,
    notes: data.notes || "",
    updated_at: now,
  };

  if (isSupabaseConfigured()) {
    const existing = await getHealthLogByDate(data.date);
    const dbPayload = existing
      ? { ...payload, id: existing.id }
      : { ...payload, id: generateId(), created_at: now };

    const { data: result, error } = await supabase
      .from("health_logs")
      .upsert(dbPayload, { onConflict: "user_id,date" })
      .select().single();
    if (error) throw error;
    return result;
  }

  const logs = await getLocalHealthLogs();
  const existingIdx = logs.findIndex(l => l.date === data.date);
  let result: HealthLog;
  if (existingIdx >= 0) {
    logs[existingIdx] = { ...logs[existingIdx], ...payload };
    result = logs[existingIdx];
  } else {
    result = { id: generateId(), ...payload, created_at: now } as HealthLog;
    logs.push(result);
  }
  await setLocalHealthLogs(logs);
  return result;
}

export async function deleteHealthLog(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("health_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (error) throw error;
    return;
  }
  const logs = (await getLocalHealthLogs()).filter(l => l.id !== id);
  await setLocalHealthLogs(logs);
}

export async function getHealthGoals() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("health_goals")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error || !data) return { sleep_hours_goal: 7, water_intake_goal: 2.5, steps_goal: 8000 };
  return data;
}

export async function upsertHealthGoals(goals: { sleep_hours_goal: number; water_intake_goal: number; steps_goal: number }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("health_goals")
    .upsert({ ...goals, user_id: user.id }, { onConflict: "user_id" })
    .select().single();
  if (error) throw error;
  return data;
}
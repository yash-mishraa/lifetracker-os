import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { HealthLog, HealthFormData } from "@/lib/types/health";

const HEALTH_LOGS_KEY = "lifeos_health_logs";

// SSR-safe pseudo-random UUIDv4
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getLocalHealthLogs(): HealthLog[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HEALTH_LOGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setLocalHealthLogs(logs: HealthLog[]) {
  localStorage.setItem(HEALTH_LOGS_KEY, JSON.stringify(logs));
}

// ─── Health Service ─────────────────────────────────────────────────────────

export async function getHealthLogs(startDate?: string, endDate?: string): Promise<HealthLog[]> {
  if (isSupabaseConfigured()) {
    let query = supabase.from("health_logs").select("*").order("date", { ascending: true });
    
    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  let logs = getLocalHealthLogs();
  if (startDate) logs = logs.filter(l => l.date >= startDate);
  if (endDate) logs = logs.filter(l => l.date <= endDate);
  
  // Sort ascending by date
  return logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getHealthLogByDate(date: string): Promise<HealthLog | null> {
  const logs = await getHealthLogs(date, date);
  return logs.length > 0 ? logs[0] : null;
}

export async function upsertHealthLog(data: HealthFormData): Promise<HealthLog> {
  const now = new Date().toISOString();


  // Clean up data
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
    // 1. Check if log exists for date
    const existing = await getHealthLogByDate(data.date);
    
    let dbPayload;
    if (existing) {
      dbPayload = { ...payload, id: existing.id };
    } else {
      dbPayload = { ...payload, id: generateId(), created_at: now };
    }

    const { data: result, error } = await supabase
      .from("health_logs")
      .upsert(dbPayload, { onConflict: "user_id,date" })
      .select()
      .single();
      
    if (error) throw error;
    return result;
  }

  // Local storage fallback
  const logs = getLocalHealthLogs();
  const existingIdx = logs.findIndex(l => l.date === data.date);
  
  let result: HealthLog;
  if (existingIdx >= 0) {
    logs[existingIdx] = { ...logs[existingIdx], ...payload };
    result = logs[existingIdx];
  } else {
    result = { id: generateId(), ...payload, created_at: now } as HealthLog;
    logs.push(result);
  }
  
  setLocalHealthLogs(logs);
  return result;
}

export async function deleteHealthLog(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("health_logs").delete().eq("id", id);
    if (error) throw error;
  } else {
    const logs = getLocalHealthLogs().filter(l => l.id !== id);
    setLocalHealthLogs(logs);
  }
}

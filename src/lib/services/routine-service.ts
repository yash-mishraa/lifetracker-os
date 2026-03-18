import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Routine, RoutineStep, RoutineLog, RoutineStats, RoutineFormData } from "@/lib/types/routine";

async function getUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? "anonymous";
  } catch { return "anonymous"; }
}

async function keys() {
  const uid = await getUserId();
  return {
    routines: `lifeos_routines_${uid}`,
    steps: `lifeos_routine_steps_${uid}`,
    logs: `lifeos_routine_logs_${uid}`,
  };
}

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

function getLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function setLocal<T>(key: string, data: T[]) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(data));
}

async function maybeSeed() {
  const k = await keys();
  if (typeof window === "undefined" || localStorage.getItem(k.routines)) return;
  const morningId = generateId();
  const nightId = generateId();
  setLocal(k.routines, [
    { id: morningId, title: "Morning Routine", type: "morning", created_at: new Date().toISOString() },
    { id: nightId, title: "Night Routine", type: "night", created_at: new Date().toISOString() },
  ]);
  setLocal(k.steps, [
    { id: generateId(), routine_id: morningId, title: "Meditate", position: 1, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: morningId, title: "Exercise", position: 2, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: morningId, title: "Plan day", position: 3, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: morningId, title: "Drink water", position: 4, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: nightId, title: "Review day", position: 1, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: nightId, title: "Read", position: 2, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: nightId, title: "Sleep log", position: 3, created_at: new Date().toISOString() },
  ]);
}

export async function getRoutines(): Promise<Routine[]> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase.from("routines").select("*").eq("user_id", session.user.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    }
  }
  await maybeSeed();
  return getLocal<Routine>((await keys()).routines);
}

export async function createRoutine(form: RoutineFormData): Promise<Routine> {
  const routine: Routine = { id: generateId(), title: form.title, type: form.type, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase.from("routines").insert({ ...routine, user_id: session.user.id }).select().single();
      if (error) throw error;
      return data;
    }
  }
  const k = await keys();
  const list = getLocal<Routine>(k.routines);
  list.push(routine);
  setLocal(k.routines, list);
  return routine;
}

export async function deleteRoutine(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error } = await supabase.from("routines").delete().eq("id", id).eq("user_id", session.user.id);
      if (error) throw error;
      return;
    }
  }
  const k = await keys();
  setLocal(k.routines, getLocal<Routine>(k.routines).filter(r => r.id !== id));
  setLocal(k.steps, getLocal<RoutineStep>(k.steps).filter(s => s.routine_id !== id));
}

export async function getRoutineSteps(routineId: string): Promise<RoutineStep[]> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase.from("routine_steps").select("*").eq("routine_id", routineId).eq("user_id", session.user.id).order("position", { ascending: true });
      if (error) throw error;
      return data || [];
    }
  }
  return getLocal<RoutineStep>((await keys()).steps).filter(s => s.routine_id === routineId).sort((a, b) => a.position - b.position);
}

export async function createRoutineStep(routineId: string, title: string): Promise<RoutineStep> {
  const existing = await getRoutineSteps(routineId);
  const position = existing.length > 0 ? Math.max(...existing.map(s => s.position)) + 1 : 1;
  const step: RoutineStep = { id: generateId(), routine_id: routineId, title, position, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase.from("routine_steps").insert({ ...step, user_id: session.user.id }).select().single();
      if (error) throw error;
      return data;
    }
  }
  const k = await keys();
  const list = getLocal<RoutineStep>(k.steps);
  list.push(step);
  setLocal(k.steps, list);
  return step;
}

export async function deleteRoutineStep(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error } = await supabase.from("routine_steps").delete().eq("id", id).eq("user_id", session.user.id);
      if (error) throw error;
      return;
    }
  }
  const k = await keys();
  setLocal(k.steps, getLocal<RoutineStep>(k.steps).filter(s => s.id !== id));
}

export async function getRoutineLogs(routineId: string): Promise<RoutineLog[]> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase.from("routine_logs").select("*").eq("routine_id", routineId).eq("user_id", session.user.id);
      if (error) throw error;
      return data || [];
    }
  }
  return getLocal<RoutineLog>((await keys()).logs).filter(l => l.routine_id === routineId);
}

export async function getRoutineLogByDate(routineId: string, date: string): Promise<RoutineLog | null> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase.from("routine_logs").select("*").eq("routine_id", routineId).eq("user_id", session.user.id).eq("date", date).maybeSingle();
      if (error) return null;
      return data;
    }
  }
  const logs = getLocal<RoutineLog>((await keys()).logs);
  return logs.find(l => l.routine_id === routineId && l.date === date) || null;
}

export async function updateRoutineLog(routineId: string, date: string, completedStepIds: string[], totalStepsForRoutine: number): Promise<RoutineLog> {
  const isCompleted = completedStepIds.length === totalStepsForRoutine && totalStepsForRoutine > 0;
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id;
    if (user_id) {
      const existing = await getRoutineLogByDate(routineId, date);
      if (existing) {
        const { data, error } = await supabase.from("routine_logs").update({ completed_step_ids: completedStepIds, is_completed: isCompleted }).eq("id", existing.id).eq("user_id", user_id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("routine_logs").insert({ routine_id: routineId, user_id, date, completed_step_ids: completedStepIds, is_completed: isCompleted }).select().single();
        if (error) throw error;
        return data;
      }
    }
  }
  const k = await keys();
  const logs = getLocal<RoutineLog>(k.logs);
  const idx = logs.findIndex(l => l.routine_id === routineId && l.date === date);
  if (idx !== -1) {
    logs[idx] = { ...logs[idx], completed_step_ids: completedStepIds, is_completed: isCompleted };
    setLocal(k.logs, logs);
    return logs[idx];
  }
  const newLog: RoutineLog = { id: generateId(), routine_id: routineId, date, completed_step_ids: completedStepIds, is_completed: isCompleted };
  logs.push(newLog);
  setLocal(k.logs, logs);
  return newLog;
}

export async function getRoutineStats(routineId: string): Promise<RoutineStats> {
  const logs = await getRoutineLogs(routineId);
  const completedDates = logs.filter(l => l.is_completed).map(l => l.date).sort();
  if (completedDates.length === 0) return { currentStreak: 0, longestStreak: 0, completionRate: 0 };
  let cur = 1, longest = 1;
  for (let i = 1; i < completedDates.length; i++) {
    const diff = Math.ceil(Math.abs(new Date(completedDates[i]).getTime() - new Date(completedDates[i-1]).getTime()) / 86400000);
    if (diff === 1) { cur++; longest = Math.max(longest, cur); }
    else if (diff > 1) { cur = 1; }
  }
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const last = completedDates[completedDates.length - 1];
  const currentStreak = (last === today || last === yesterday) ? cur : 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const thirtyCount = completedDates.filter(d => d >= thirtyDaysAgo && d <= today).length;
  return { currentStreak, longestStreak: longest, completionRate: Math.round((thirtyCount / 30) * 100) };
}
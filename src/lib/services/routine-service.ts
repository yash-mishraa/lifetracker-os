import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Routine,
  RoutineStep,
  RoutineLog,
  RoutineStats,
  RoutineFormData,
} from "@/lib/types/routine";

// ─── Local Storage Helpers ───────────────────────────────────────────────────

const ROUTINES_KEY = "lifeos_routines";
const ROUTINE_STEPS_KEY = "lifeos_routine_steps";
const ROUTINE_LOGS_KEY = "lifeos_routine_logs";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      parseInt(c) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (parseInt(c) / 4)))
    ).toString(16)
  );
}

function getLocalData<T>(key: string, _default: T[] = []): T[] {
  if (typeof window === "undefined") return _default;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : _default;
}

function setLocalData<T>(key: string, data: T[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// ─── Seed Data (Local Only) ────────────────────────────────────────────────

if (typeof window !== "undefined" && !localStorage.getItem(ROUTINES_KEY)) {
  const morningId = generateId();
  const nightId = generateId();
  const routines: Routine[] = [
    { id: morningId, title: "Morning Routine", type: "morning", created_at: new Date().toISOString() },
    { id: nightId, title: "Night Routine", type: "night", created_at: new Date().toISOString() },
  ];
  
  const steps: RoutineStep[] = [
    { id: generateId(), routine_id: morningId, title: "Meditate", position: 1, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: morningId, title: "Exercise", position: 2, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: morningId, title: "Plan day", position: 3, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: morningId, title: "Drink water", position: 4, created_at: new Date().toISOString() },
    
    { id: generateId(), routine_id: nightId, title: "Review day", position: 1, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: nightId, title: "Read", position: 2, created_at: new Date().toISOString() },
    { id: generateId(), routine_id: nightId, title: "Sleep log", position: 3, created_at: new Date().toISOString() },
  ];

  setLocalData(ROUTINES_KEY, routines);
  setLocalData(ROUTINE_STEPS_KEY, steps);
}

// ─── Routines ────────────────────────────────────────────────────────────────

export async function getRoutines(): Promise<Routine[]> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    }
  }
  return getLocalData<Routine>(ROUTINES_KEY);
}

export async function createRoutine(form: RoutineFormData): Promise<Routine> {
  const routine: Routine = {
    id: generateId(),
    title: form.title,
    type: form.type,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id;

    if (user_id) {
      const insertData = { ...routine, user_id };
      const { data, error } = await supabase
        .from("routines")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  const routines = getLocalData<Routine>(ROUTINES_KEY);
  routines.push(routine);
  setLocalData(ROUTINES_KEY, routines);
  return routine;
}

export async function deleteRoutine(id: string): Promise<void> {
  let isDeletedFromSupabase = false;
  
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (error) throw error;
      isDeletedFromSupabase = true;
    }
  } 
  
  if (!isDeletedFromSupabase) {
    let routines = getLocalData<Routine>(ROUTINES_KEY);
    routines = routines.filter(r => r.id !== id);
    setLocalData(ROUTINES_KEY, routines);
    
    // Cleanup steps
    let steps = getLocalData<RoutineStep>(ROUTINE_STEPS_KEY);
    steps = steps.filter(s => s.routine_id !== id);
    setLocalData(ROUTINE_STEPS_KEY, steps);
  }
}

// ─── Routine Steps ───────────────────────────────────────────────────────────

export async function getRoutineSteps(routineId: string): Promise<RoutineStep[]> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from("routine_steps")
        .select("*")
        .eq("routine_id", routineId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data || [];
    }
  }
  return getLocalData<RoutineStep>(ROUTINE_STEPS_KEY)
    .filter(s => s.routine_id === routineId)
    .sort((a, b) => a.position - b.position);
}

export async function createRoutineStep(routineId: string, title: string): Promise<RoutineStep> {
  const existingSteps = await getRoutineSteps(routineId);
  const position = existingSteps.length > 0 ? Math.max(...existingSteps.map(s => s.position)) + 1 : 1;

  const step: RoutineStep = {
    id: generateId(),
    routine_id: routineId,
    title,
    position,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id;
    
    if (user_id) {
      const insertData = { ...step, user_id };
      const { data, error } = await supabase
        .from("routine_steps")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  const steps = getLocalData<RoutineStep>(ROUTINE_STEPS_KEY);
  steps.push(step);
  setLocalData(ROUTINE_STEPS_KEY, steps);
  return step;
}

export async function deleteRoutineStep(id: string): Promise<void> {
  let isDeletedFromSupabase = false;
  
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error } = await supabase.from("routine_steps").delete().eq("id", id);
      if (error) throw error;
      isDeletedFromSupabase = true;
    }
  } 
  
  if (!isDeletedFromSupabase) {
    let steps = getLocalData<RoutineStep>(ROUTINE_STEPS_KEY);
    steps = steps.filter(s => s.id !== id);
    setLocalData(ROUTINE_STEPS_KEY, steps);
  }
}

// ─── Routine Logs ────────────────────────────────────────────────────────────

export async function getRoutineLogs(routineId: string): Promise<RoutineLog[]> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from("routine_logs")
        .select("*")
        .eq("routine_id", routineId);
      if (error) throw error;
      return data || [];
    }
  }
  return getLocalData<RoutineLog>(ROUTINE_LOGS_KEY)
    .filter(l => l.routine_id === routineId);
}

export async function getRoutineLogByDate(routineId: string, date: string): Promise<RoutineLog | null> {
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from("routine_logs")
        .select("*")
        .eq("routine_id", routineId)
        .eq("date", date)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  }
  const logs = getLocalData<RoutineLog>(ROUTINE_LOGS_KEY);
  return logs.find(l => l.routine_id === routineId && l.date === date) || null;
}

export async function updateRoutineLog(
  routineId: string, 
  date: string, 
  completedStepIds: string[], 
  totalStepsForRoutine: number
): Promise<RoutineLog> {
  const isCompleted = completedStepIds.length === totalStepsForRoutine && totalStepsForRoutine > 0;
  
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id;
    
    if (user_id) {
      // Check if log exists
      let { data: existing } = await supabase
        .from("routine_logs")
        .select("*")
        .eq("routine_id", routineId)
        .eq("date", date)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("routine_logs")
          .update({ completed_step_ids: completedStepIds, is_completed: isCompleted })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const log = {
          routine_id: routineId,
          user_id,
          date,
          completed_step_ids: completedStepIds,
          is_completed: isCompleted
        };
        const { data, error } = await supabase
          .from("routine_logs")
          .insert(log)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
  }

  const logs = getLocalData<RoutineLog>(ROUTINE_LOGS_KEY);
  const existingIdx = logs.findIndex(l => l.routine_id === routineId && l.date === date);
  
  if (existingIdx !== -1) {
    logs[existingIdx].completed_step_ids = completedStepIds;
    logs[existingIdx].is_completed = isCompleted;
    setLocalData(ROUTINE_LOGS_KEY, logs);
    return logs[existingIdx];
  } else {
    const newLog: RoutineLog = {
      id: generateId(),
      routine_id: routineId,
      date,
      completed_step_ids: completedStepIds,
      is_completed: isCompleted
    };
    logs.push(newLog);
    setLocalData(ROUTINE_LOGS_KEY, logs);
    return newLog;
  }
}

// ─── Streaks & Stats ─────────────────────────────────────────────────────────

export async function getRoutineStats(routineId: string): Promise<RoutineStats> {
  const logs = await getRoutineLogs(routineId);
  const completedDates = logs.filter(l => l.is_completed).map(l => l.date).sort();

  if (completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completionRate: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakTemp = 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  // Calculate generic streaks by looking at contiguous days in the completed logs.
  if (completedDates.length > 0) {
    currentStreakTemp = 1;
    longestStreak = 1;

    for (let i = 1; i < completedDates.length; i++) {
      const prevDate = new Date(completedDates[i - 1]);
      const currDate = new Date(completedDates[i]);
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreakTemp++;
        longestStreak = Math.max(longestStreak, currentStreakTemp);
      } else if (diffDays > 1) {
        currentStreakTemp = 1;
      }
    }

    // Determine currently active streak. If they completed today or yesterday, the streak is alive.
    const lastCompleted = completedDates[completedDates.length - 1];
    if (lastCompleted === today || lastCompleted === yesterday) {
      currentStreak = currentStreakTemp;
    } else {
      currentStreak = 0; // Streak broken
    }
  }

  // Last 30 days completion rate
  let thirtyDaysCompletions = 0;
  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const thirtyDaysAgo = thirtyDaysAgoDate.toISOString().split("T")[0];

  completedDates.forEach(date => {
    if (date >= thirtyDaysAgo && date <= today) {
      thirtyDaysCompletions++;
    }
  });

  const completionRate = Math.round((thirtyDaysCompletions / 30) * 100);

  return {
    currentStreak,
    longestStreak,
    completionRate,
  };
}

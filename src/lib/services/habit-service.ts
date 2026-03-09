import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Habit,
  HabitLog,
  HabitFormData,
  HabitStats,
} from "@/lib/types/habit";
import { startOfDay, subDays, format, parseISO, isSameDay, differenceInDays } from "date-fns";

// ─── Removed Local Storage Helpers ─────────────────────────────────────────────

// ─── Habit Service ────────────────────────────────────────────────────────────

export async function getHabits(): Promise<Habit[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to view habits.");

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq('user_id', session.user.id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getHabitLogs(startDate?: string, endDate?: string): Promise<HabitLog[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to view habit logs.");

  let query = supabase.from("habit_logs").select("*").eq('user_id', session.user.id);
  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createHabit(form: HabitFormData): Promise<Habit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to create habits.");

  const cleanForm = { ...form };
  if (cleanForm.reminder_time === "") {
    cleanForm.reminder_time = null as any;
  }

  const { data, error } = await supabase
    .from("habits")
    .insert({ ...cleanForm, user_id: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateHabit(id: string, updates: Partial<HabitFormData>): Promise<Habit> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to update habits.");

  const cleanUpdates = { ...updates };
  if (cleanUpdates.reminder_time === "") {
    cleanUpdates.reminder_time = null as any;
  }

  const { data, error } = await supabase
    .from("habits")
    .update(cleanUpdates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHabit(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to delete habits.");

  const { error } = await supabase.from("habits").delete().eq("id", id).eq('user_id', session.user.id);
  if (error) throw error;
}

// ─── Log Toggling ────────────────────────────────────────────────────────────

export async function toggleHabitCompletion(habitId: string, date: string, targetValue: number, currentCompleted: boolean): Promise<HabitLog> {
  const isNowCompleted = !currentCompleted;
  const value = isNowCompleted ? targetValue : 0;
  
  return upsertHabitLog(habitId, date, isNowCompleted, value);
}

export async function updateHabitValue(habitId: string, date: string, value: number, targetValue: number): Promise<HabitLog> {
  const isCompleted = value >= targetValue;
  
  return upsertHabitLog(habitId, date, isCompleted, value);
}

async function upsertHabitLog(habitId: string, date: string, completed: boolean, value: number): Promise<HabitLog> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to update habit logs.");

  // Supabase upsert using the unique constraint on habit_id and date
  const { data, error } = await supabase
    .from("habit_logs")
    .upsert({ habit_id: habitId, date, completed, value, user_id: session.user.id }, { onConflict: "habit_id,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Statistics Logic ────────────────────────────────────────────────────────

// Helper to check if a specific date day-of-week is required for a habit
function isDateRequired(date: Date, habit: Habit): boolean {
  if (habit.frequency_type === "daily") return true;
  if (habit.frequency_type === "weekdays") {
    // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    const day = date.getDay();
    return habit.frequency_days.includes(day);
  }
  if (habit.frequency_type === "custom") {
    // For custom, any day CAN contribute, but we calculate streaks slightly differently.
    // Simplifying: treat it like daily for now, or just true.
    return true;
  }
  return true;
}

export function calculateHabitStats(habit: Habit, allLogs: HabitLog[]): HabitStats {
  const habitLogs = allLogs.filter((l) => l.habit_id === habit.id && l.completed);
  const totalCompletions = habitLogs.length;

  // Create a fast lookup set of completed date strings (YYYY-MM-DD)
  const completedDates = new Set(habitLogs.map((l) => l.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // We look back over the last 365 days to find the longest streak and current streak
  // A streak continues if a REQUIRED day is completed.
  // A streak doesn't break if a NON-REQUIRED day is missed, but completion on a non-required day adds to the streak.
  
  const today = startOfDay(new Date());

  for (let i = 365; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const isCompleted = completedDates.has(dateStr);
    const required = isDateRequired(d, habit);

    if (isCompleted) {
      tempStreak++;
    } else {
      if (required) {
        // Streak broken
        tempStreak = 0;
      }
      // If not required and not completed, streak is maintained (paused), so do nothing to tempStreak
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // Keep updating current streak until today
    if (i === 0) {
      // It's today.
      currentStreak = tempStreak;
      // If today is required, not completed, but we haven't reached end of day,
      // usually current streak relies on YESTERDAY. 
      // If we didn't complete today yet, but yesterday was completed, the streak feels "alive" until tomorrow.
      // Adjusting current streak based on yesterday if today isn't strictly broken.
      if (!isCompleted && required) {
        // Check if yesterday's state was an active streak. 
        // If today is required and missed, the tempStreak just went to 0. 
        // But if we just look at the app in the morning, the streak shouldn't read 0.
        // So we calculate strictly up to yesterday for current streak.
        
        let yesterdayStreak = 0;
        let pTemp = 0;
        for(let j=365; j>=1; j--) {
           const yd = subDays(today, j);
           const yDateStr = format(yd, "yyyy-MM-dd");
           const yIsCompleted = completedDates.has(yDateStr);
           const yRequired = isDateRequired(yd, habit);
           
           if(yIsCompleted) pTemp++;
           else if(yRequired) pTemp = 0;
        }
        currentStreak = pTemp;
      }
    }
  }

  // Completion Rate (Last 30 Days)
  let requiredDaysInLast30 = 0;
  let completedDaysInLast30 = 0;
  
  for (let i = 0; i < 30; i++) {
    const d = subDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const isCompleted = completedDates.has(dateStr);
    const required = isDateRequired(d, habit);

    if (required) requiredDaysInLast30++;
    if (isCompleted) completedDaysInLast30++;
  }

  const completionRate = requiredDaysInLast30 > 0 
    ? Math.round((completedDaysInLast30 / requiredDaysInLast30) * 100) 
    : 0;

  return {
    currentStreak,
    longestStreak,
    completionRate,
    totalCompletions
  };
}

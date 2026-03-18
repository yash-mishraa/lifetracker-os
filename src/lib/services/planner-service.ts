import { TimeBlock, EnergyLevel } from "../types/planner";
import { getTasks } from "./task-service";
import { getHabits, getHabitLogs } from "./habit-service";
import { supabase } from "../supabase";
import { parseISO, isSameDay, addMinutes, format } from "date-fns";

async function getStorageKey(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? "anonymous";
    return `lifeos_planner_schedule_${uid}`;
  } catch {
    return "lifeos_planner_schedule_anonymous";
  }
}

function getEnergyLevelForTask(priority: string): EnergyLevel {
  switch (priority) {
    case "critical": case "high": return "High";
    case "medium": return "Medium";
    default: return "Low";
  }
}

async function getAllSchedules(): Promise<Record<string, TimeBlock[]>> {
  if (typeof window === "undefined") return {};
  try {
    const key = await getStorageKey();
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function saveAllSchedules(all: Record<string, TimeBlock[]>): Promise<void> {
  if (typeof window !== "undefined") {
    const key = await getStorageKey();
    localStorage.setItem(key, JSON.stringify(all));
  }
}

export async function getScheduleForDate(date: Date): Promise<TimeBlock[]> {
  const dateStr = format(date, "yyyy-MM-dd");
  const all = await getAllSchedules();
  return all[dateStr] ?? [];
}

export async function saveScheduleForDate(date: Date, blocks: TimeBlock[]): Promise<void> {
  const dateStr = format(date, "yyyy-MM-dd");
  const all = await getAllSchedules();
  all[dateStr] = blocks;
  await saveAllSchedules(all);
}

export async function getTodaySchedule(): Promise<TimeBlock[]> {
  return getScheduleForDate(new Date());
}

export async function saveSchedule(blocks: TimeBlock[]): Promise<void> {
  return saveScheduleForDate(new Date(), blocks);
}

export async function generateAutoSchedule(): Promise<TimeBlock[]> {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const dayOfWeek = today.getDay();
  const [tasks, habits, habitLogs] = await Promise.all([getTasks(), getHabits(), getHabitLogs()]);
  const blocks: TimeBlock[] = [];

  const activeTasks = tasks
    .filter(t => {
      if (t.status === "completed") return false;
      if (!t.deadline) return true;
      const due = parseISO(t.deadline);
      return isSameDay(due, today) || due < today;
    })
    .sort((a, b) => {
      const w: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return w[b.priority] - w[a.priority];
    });

  const activeHabits = habits.filter(h => {
    let scheduled = false;
    if (h.frequency_type === "daily") scheduled = true;
    if (h.frequency_type === "weekdays" && h.frequency_days.includes(dayOfWeek)) scheduled = true;
    if (h.frequency_type === "custom") scheduled = true;
    if (!scheduled) return false;
    const log = habitLogs.find(l => l.habit_id === h.id && l.date === todayStr);
    return !log || !log.completed;
  });

  let morning = new Date(today); morning.setHours(9, 0, 0, 0);
  let afternoon = new Date(today); afternoon.setHours(13, 0, 0, 0);
  let evening = new Date(today); evening.setHours(18, 0, 0, 0);

  for (const task of activeTasks) {
    const energy = getEnergyLevelForTask(task.priority);
    const mins = task.estimated_minutes || 60;
    let start: Date;
    if (energy === "High") { start = new Date(morning); morning = addMinutes(start, mins + 15); }
    else if (energy === "Medium") { start = new Date(afternoon); afternoon = addMinutes(start, mins + 15); }
    else { start = new Date(evening); evening = addMinutes(start, mins + 15); }
    blocks.push({ id: `task-${task.id}`, type: "task", title: task.title, description: task.description, energyLevel: energy, startTime: format(start, "HH:mm"), endTime: format(addMinutes(start, mins), "HH:mm"), sourceId: task.id, isCompleted: false });
  }

  for (const habit of activeHabits) {
    let start: Date;
    if (habit.reminder_time) {
      const [h, m] = habit.reminder_time.split(":").map(Number);
      start = new Date(today); start.setHours(h, m, 0, 0);
    } else { start = new Date(evening); evening = addMinutes(start, 40); }
    blocks.push({ id: `habit-${habit.id}`, type: "habit", title: habit.name, energyLevel: "Low", startTime: format(start, "HH:mm"), endTime: format(addMinutes(start, 30), "HH:mm"), sourceId: habit.id, isCompleted: false });
  }

  blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return blocks;
}

export async function updateBlockTime(blockId: string, newStartTime: string, newEndTime: string): Promise<TimeBlock[]> {
  const blocks = await getTodaySchedule();
  const updated = blocks.map(b => b.id === blockId && !b.isLocked ? { ...b, startTime: newStartTime, endTime: newEndTime } : b);
  updated.sort((a, b) => a.startTime.localeCompare(b.startTime));
  await saveSchedule(updated);
  return updated;
}
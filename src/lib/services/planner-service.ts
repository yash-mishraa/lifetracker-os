import { TimeBlock, BlockType, EnergyLevel, DaySchedule } from "../types/planner";
import { getTasks } from "./task-service";
import { getHabits, getHabitLogs } from "./habit-service";
import { parseISO, isSameDay, addMinutes, format } from "date-fns";

const STORAGE_KEY = 'lifeos_planner_schedule';

function getEnergyLevelForTask(priority: string): EnergyLevel {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Medium';
  }
}

function getAllSchedules(): Record<string, TimeBlock[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllSchedules(all: Record<string, TimeBlock[]>): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export async function getScheduleForDate(date: Date): Promise<TimeBlock[]> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const all = getAllSchedules();
  return all[dateStr] ?? [];
}

export async function saveScheduleForDate(date: Date, blocks: TimeBlock[]): Promise<void> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const all = getAllSchedules();
  all[dateStr] = blocks;
  saveAllSchedules(all);
}

// Legacy compat — used by other parts of the app
export async function getTodaySchedule(): Promise<TimeBlock[]> {
  return getScheduleForDate(new Date());
}

export async function saveSchedule(blocks: TimeBlock[]): Promise<void> {
  return saveScheduleForDate(new Date(), blocks);
}

export async function generateAutoSchedule(): Promise<TimeBlock[]> {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = today.getDay();

  const [tasks, habits, habitLogs] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitLogs()
  ]);

  const blocks: TimeBlock[] = [];

  const activeTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.deadline) return true;
    const due = parseISO(t.deadline);
    return isSameDay(due, today) || due < today;
  });

  const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  activeTasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  const activeHabits = habits.filter(h => {
    let scheduledToday = false;
    if (h.frequency_type === 'daily') scheduledToday = true;
    if (h.frequency_type === 'weekdays' && h.frequency_days.includes(dayOfWeek)) scheduledToday = true;
    if (h.frequency_type === 'custom') scheduledToday = true;
    if (!scheduledToday) return false;
    const log = habitLogs.find(l => l.habit_id === h.id && l.date === todayStr);
    return !log || !log.completed;
  });

  let currentMorningTime = new Date(today); currentMorningTime.setHours(9, 0, 0, 0);
  let currentAfternoonTime = new Date(today); currentAfternoonTime.setHours(13, 0, 0, 0);
  let currentEveningTime = new Date(today); currentEveningTime.setHours(18, 0, 0, 0);

  for (const task of activeTasks) {
    const energy = getEnergyLevelForTask(task.priority);
    let startTime: Date;
    const durationMins = task.estimated_minutes || 60;

    if (energy === 'High') {
      startTime = new Date(currentMorningTime);
      currentMorningTime = addMinutes(startTime, durationMins + 15);
    } else if (energy === 'Medium') {
      startTime = new Date(currentAfternoonTime);
      currentAfternoonTime = addMinutes(startTime, durationMins + 15);
    } else {
      startTime = new Date(currentEveningTime);
      currentEveningTime = addMinutes(startTime, durationMins + 15);
    }

    blocks.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      description: task.description,
      energyLevel: energy,
      startTime: format(startTime, 'HH:mm'),
      endTime: format(addMinutes(startTime, durationMins), 'HH:mm'),
      sourceId: task.id,
      isCompleted: false
    });
  }

  for (const habit of activeHabits) {
    let startTime: Date;
    if (habit.reminder_time) {
      const [h, m] = habit.reminder_time.split(':').map(Number);
      startTime = new Date(today);
      startTime.setHours(h, m, 0, 0);
    } else {
      startTime = new Date(currentEveningTime);
      currentEveningTime = addMinutes(startTime, 40);
    }

    blocks.push({
      id: `habit-${habit.id}`,
      type: 'habit',
      title: habit.name,
      energyLevel: 'Low',
      startTime: format(startTime, 'HH:mm'),
      endTime: format(addMinutes(startTime, 30), 'HH:mm'),
      sourceId: habit.id,
      isCompleted: false
    });
  }

  blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return blocks;
}

export async function updateBlockTime(blockId: string, newStartTime: string, newEndTime: string): Promise<TimeBlock[]> {
  const blocks = await getTodaySchedule();
  const updated = blocks.map(b =>
    b.id === blockId && !b.isLocked ? { ...b, startTime: newStartTime, endTime: newEndTime } : b
  );
  updated.sort((a, b) => a.startTime.localeCompare(b.startTime));
  await saveSchedule(updated);
  return updated;
}
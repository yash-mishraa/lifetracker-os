import { TimeBlock, BlockType, EnergyLevel, DaySchedule } from "../types/planner";
import { getTasks } from "./task-service";
import { getHabits, getHabitLogs } from "./habit-service";
import { getGoals } from "./goal-service";
import { parseISO, isSameDay, addMinutes, format, isToday } from "date-fns";

const STORAGE_KEY = 'lifeos_planner_schedule';

// Helper to determine energy level of a task based on priority
function getEnergyLevelForTask(priority: string): EnergyLevel {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'High'; // Deep work, Morning
    case 'medium':
      return 'Medium'; // Afternoon
    case 'low':
      return 'Low'; // Evening/Routine
    default:
      return 'Medium';
  }
}

// Generate a default schedule for today based on active/due items
export async function generateAutoSchedule(): Promise<TimeBlock[]> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  const [tasks, habits, habitLogs] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitLogs()
  ]);

  const blocks: TimeBlock[] = [];
  
  // 1. Filter Tasks due today or overdue, not completed
  const activeTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.deadline) return true; // Include tasks with no deadline as flexible
    const due = parseISO(t.deadline);
    return isSameDay(due, today) || due < today;
  });

  // Sort tasks by priority
  const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  activeTasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  // 2. Filter Habits scheduled for today, not completed
  const activeHabits = habits.filter(h => {
    let scheduledToday = false;
    if (h.frequency_type === 'daily') scheduledToday = true;
    if (h.frequency_type === 'weekdays' && h.frequency_days.includes(dayOfWeek)) scheduledToday = true;
    if (h.frequency_type === 'custom') scheduledToday = true;
    
    if (!scheduledToday) return false;

    const log = habitLogs.find(l => l.habit_id === h.id && l.date === todayStr);
    return !log || !log.completed;
  });

  // --- Scheduling Algorithm ---
  // Morning (High Energy): 09:00 - 12:00
  // Afternoon (Medium Energy): 13:00 - 17:00
  // Evening (Low/Routine): 18:00 - 20:00

  let currentMorningTime = new Date(today);
  currentMorningTime.setHours(9, 0, 0, 0);

  let currentAfternoonTime = new Date(today);
  currentAfternoonTime.setHours(13, 0, 0, 0);

  let currentEveningTime = new Date(today);
  currentEveningTime.setHours(18, 0, 0, 0);

  // Allocate Tasks
  for (const task of activeTasks) {
    const energy = getEnergyLevelForTask(task.priority);
    let startTime: Date;
    let endTime: Date;
    let durationMins = task.estimated_minutes || 60; // Default 1 hour if not set
    
    if (energy === 'High') {
      startTime = new Date(currentMorningTime);
      endTime = addMinutes(startTime, durationMins);
      currentMorningTime = addMinutes(endTime, 15); // Add 15 min buffer/break
    } else if (energy === 'Medium') {
      startTime = new Date(currentAfternoonTime);
      endTime = addMinutes(startTime, durationMins);
      currentAfternoonTime = addMinutes(endTime, 15);
    } else {
      startTime = new Date(currentEveningTime);
      endTime = addMinutes(startTime, durationMins);
      currentEveningTime = addMinutes(endTime, 15);
    }

    blocks.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      description: task.description,
      energyLevel: energy,
      startTime: format(startTime, 'HH:mm'),
      endTime: format(endTime, 'HH:mm'),
      sourceId: task.id,
      isCompleted: false
    });
  }

  // Allocate Habits (Usually Evening/Routine, unless they have a specific reminder time)
  for (const habit of activeHabits) {
    let startTime: Date;
    let endTime: Date;

    if (habit.reminder_time) {
      const [h, m] = habit.reminder_time.split(':').map(Number);
      startTime = new Date(today);
      startTime.setHours(h, m, 0, 0);
      endTime = addMinutes(startTime, 30); // Assume 30 mins for a habit
    } else {
      startTime = new Date(currentEveningTime);
      endTime = addMinutes(startTime, 30);
      currentEveningTime = addMinutes(endTime, 10);
    }

    blocks.push({
      id: `habit-${habit.id}`,
      type: 'habit',
      title: habit.name,
      energyLevel: 'Low',
      startTime: format(startTime, 'HH:mm'),
      endTime: format(endTime, 'HH:mm'),
      sourceId: habit.id,
      isCompleted: false
    });
  }

  // Pre-fill fixed breaks (e.g., Lunch)
  blocks.push({
    id: `break-lunch`,
    type: 'break',
    title: 'Lunch Break & Reset',
    energyLevel: 'Medium',
    startTime: '12:00',
    endTime: '13:00',
    isLocked: true
  });

  // Sort chronologically
  blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return blocks;
}

// Get the user's current schedule (either from storage or auto-generated)
export async function getTodaySchedule(): Promise<TimeBlock[]> {
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: DaySchedule = JSON.parse(saved);
      if (parsed.date === todayStr) {
        return parsed.blocks;
      }
    }
  }

  // If no valid saved schedule for today, auto-generate
  const blocks = await generateAutoSchedule();
  await saveSchedule(blocks);
  return blocks;
}

export async function saveSchedule(blocks: TimeBlock[]): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  const schedule: DaySchedule = {
    date: todayStr,
    blocks
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  }
}

export async function updateBlockTime(blockId: string, newStartTime: string, newEndTime: string): Promise<TimeBlock[]> {
  const blocks = await getTodaySchedule();
  const updated = blocks.map(b => {
    if (b.id === blockId && !b.isLocked) {
      return { ...b, startTime: newStartTime, endTime: newEndTime };
    }
    return b;
  });
  
  updated.sort((a, b) => a.startTime.localeCompare(b.startTime));
  await saveSchedule(updated);
  return updated;
}

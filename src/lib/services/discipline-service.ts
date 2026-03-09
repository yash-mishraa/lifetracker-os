import { DisciplineScore, DisciplineLabel, DisciplineHistory, DisciplineMetrics } from "../types/discipline";
import { getTasks } from "./task-service";
import { getHabits, getHabitLogs } from "./habit-service";
import { getTimeLogs } from "./time-service";
import { getHealthLogs } from "./health-service";
import { parseISO, isSameDay, subDays, format } from "date-fns";
import { Task } from "../types/task";
import { Habit, HabitLog } from "../types/habit";
import { TimeLog } from "../types/time";
import { HealthLog } from "../types/health";

export function getDisciplineLabel(score: number): DisciplineLabel {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Disciplined';
  if (score >= 40) return 'Improving';
  return 'Unfocused';
}

function calculateDailyMetrics(
  date: Date,
  tasks: Task[],
  habits: Habit[],
  habitLogs: HabitLog[],
  sessions: TimeLog[],
  healthLogs: HealthLog[]
): DisciplineMetrics {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = date.getDay();

  // 1. Task Score (Max 40)
  const activeTasks = tasks.filter(t => {
    if (t.status === 'completed' && t.completed_at && format(parseISO(t.completed_at), 'yyyy-MM-dd') === dateStr) return true;
    if (t.deadline) {
      const due = parseISO(t.deadline);
      return format(due, 'yyyy-MM-dd') === dateStr;
    }
    return false; // Only count tasks specifically due or completed on this day
  });

  let taskScore = 40; // Default to full points if no tasks were due (rest day)
  if (activeTasks.length > 0) {
    const completedTasks = activeTasks.filter(t => t.status === 'completed').length;
    taskScore = Math.round((completedTasks / activeTasks.length) * 40);
  }

  // 2. Habit Score (Max 30)
  const activeHabits = habits.filter(h => {
    if (h.frequency_type === 'daily') return true;
    if (h.frequency_type === 'weekdays' && h.frequency_days.includes(dayOfWeek)) return true;
    if (h.frequency_type === 'custom') return true; // simplified
    return false; // Not scheduled for today
  });

  let habitScore = 30; // Default full points if no habits scheduled
  if (activeHabits.length > 0) {
    const completedHabits = activeHabits.filter(h => {
      const log = habitLogs.find(l => l.habit_id === h.id && l.date === dateStr);
      return log && log.completed;
    }).length;
    habitScore = Math.round((completedHabits / activeHabits.length) * 30);
  }

  // 3. Focus Score (Max 20)
  // Target: 2 hours (120 mins) = 20 points
  const todaysSessions = sessions.filter(s => format(parseISO(s.end_time || s.start_time), 'yyyy-MM-dd') === dateStr);
  const totalFocusMins = todaysSessions.reduce((sum, s) => sum + Math.round(s.duration_seconds / 60), 0);
  let focusScore = Math.round(Math.min(1, totalFocusMins / 120) * 20);

  // 4. Health Score (Max 10)
  const hasLoggedHealth = healthLogs.some(l => l.date === dateStr);
  const healthScore = hasLoggedHealth ? 10 : 0;

  return {
    taskScore,
    habitScore,
    focusScore,
    healthScore
  };
}

export async function getDisciplineHistory(daysToFetch: number = 30): Promise<DisciplineHistory> {
  const [tasks, habits, habitLogs, sessions, healthLogs] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitLogs(),
    getTimeLogs(),
    getHealthLogs()
  ]);

  const today = new Date();
  const history: DisciplineScore[] = [];

  for (let i = 0; i < daysToFetch; i++) {
    const targetDate = subDays(today, i);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    
    const metrics = calculateDailyMetrics(targetDate, tasks, habits, habitLogs, sessions, healthLogs);
    const totalScore = metrics.taskScore + metrics.habitScore + metrics.focusScore + metrics.healthScore;
    
    history.push({
      date: dateStr,
      ...metrics,
      totalScore,
      label: getDisciplineLabel(totalScore)
    });
  }

  // Sort chronological for charts (oldest first)
  history.sort((a, b) => a.date.localeCompare(b.date));

  // Extract today (which is the last item after sorting)
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayScore = history.find(h => h.date === todayStr) || history[history.length - 1];

  // Averages
  const weeklyHistory = history.slice(-7);
  const weeklyAverage = Math.round(weeklyHistory.reduce((sum, h) => sum + h.totalScore, 0) / Math.max(1, weeklyHistory.length));
  const monthlyAverage = Math.round(history.reduce((sum, h) => sum + h.totalScore, 0) / Math.max(1, history.length));

  return {
    today: todayScore,
    weeklyAverage,
    monthlyAverage,
    history: weeklyHistory // Return just 7 days for the chart view for cleanliness
  };
}

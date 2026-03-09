import { getTasks } from './task-service';
import { getHabits, getHabitLogs } from './habit-service';
import { getHealthLogs } from './health-service';
import { getTimeLogs } from './time-service';
import { getGoals } from './goal-service';
import { Task } from '../types/task';
import { Habit } from '../types/habit';
import { HealthLog } from '../types/health';
import { GoalWithMilestones } from '../types/goal';
import { startOfDay, endOfDay, parseISO, isSameDay } from 'date-fns';

export interface DashboardSummary {
  tasks: {
    allDueToday: Task[];
    completedTodayCount: number;
    totalDueTodayCount: number;
  };
  habits: {
    allScheduledToday: (Habit & { isCompletedToday: boolean })[];
    completedTodayCount: number;
    totalScheduledTodayCount: number;
  };
  health: {
    todayLog: HealthLog | null;
    loggedMetricsCount: number; // Max 7
  };
  time: {
    focusSecondsToday: number;
  };
  goals: {
    topActive: { goal: GoalWithMilestones; progress: number }[];
  };
  productivityScore: number;
}

export async function getTodaySummary(): Promise<DashboardSummary> {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...

  const [allTasks, allHabits, habitLogs, healthLogs, timeLogs, allGoals] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitLogs(), // Fetches all, we filter locally
    getHealthLogs(),
    getTimeLogs(start, end),
    getGoals()
  ]);

  // --- TASKS ---
  const allDueToday = allTasks.filter(t => {
    if (!t.due_date) return false;
    const due = parseISO(t.due_date);
    // Is due today OR is overdue and not completed
    return isSameDay(due, today) || (due < today && t.status !== 'Completed');
  });
  
  const completedTodayCount = allDueToday.filter(t => t.status === 'Completed').length;
  const totalDueTodayCount = allDueToday.length;

  // --- HABITS ---
  const allScheduledToday = allHabits
    .filter(h => {
      if (h.frequency_type === 'daily') return true;
      if (h.frequency_type === 'weekdays') return h.frequency_days.includes(dayOfWeek);
      if (h.frequency_type === 'custom') return true; // simplified custom representation
      return true;
    })
    .map(h => {
      // Check if logged today
      const log = habitLogs.find(l => l.habit_id === h.id && l.date === todayStr);
      return {
        ...h,
        isCompletedToday: log ? log.completed : false
      };
    });

  const completedHabitsCount = allScheduledToday.filter(h => h.isCompletedToday).length;
  const totalScheduledTodayCount = allScheduledToday.length;

  // --- HEALTH ---
  const todayHealthLog = healthLogs.find(l => l.date === todayStr) || null;
  let loggedMetricsCount = 0;
  if (todayHealthLog) {
    if (todayHealthLog.sleep_hours !== undefined) loggedMetricsCount++;
    if (todayHealthLog.water_intake !== undefined) loggedMetricsCount++;
    if (todayHealthLog.weight !== undefined) loggedMetricsCount++;
    if (todayHealthLog.steps !== undefined) loggedMetricsCount++;
    if (todayHealthLog.calories_consumed !== undefined) loggedMetricsCount++;
    if (todayHealthLog.workout_duration !== undefined) loggedMetricsCount++;
    if (todayHealthLog.mood !== undefined) loggedMetricsCount++;
  }

  // --- TIME ---
  const focusSecondsToday = timeLogs.reduce((sum, log) => sum + log.duration_seconds, 0);

  // --- GOALS ---
  const activeGoals = allGoals.filter(g => {
    const total = g.milestones.length;
    const completed = g.milestones.filter(m => m.is_completed).length;
    return total > 0 && completed < total;
  }).map(g => {
    const total = g.milestones.length;
    const completed = g.milestones.filter(m => m.is_completed).length;
    return {
      goal: g,
      progress: Math.round((completed / total) * 100)
    };
  }).slice(0, 3); // top 3

  // --- PRODUCTIVITY SCORE (Simplified for Today only) ---
  const taskRate = totalDueTodayCount > 0 ? completedTodayCount / totalDueTodayCount : 0;
  const habitRate = totalScheduledTodayCount > 0 ? completedHabitsCount / totalScheduledTodayCount : 0;
  
  // Focus Target: 2 hours (7200 seconds)
  let focusRate = focusSecondsToday / 7200;
  if (focusRate > 1) focusRate = 1;

  // Health Target: Did they log at least 3 things today?
  let healthRate = loggedMetricsCount / 3;
  if (healthRate > 1) healthRate = 1;

  const score = Math.round((taskRate * 30) + (habitRate * 30) + (focusRate * 20) + (healthRate * 20));

  return {
    tasks: {
      allDueToday,
      completedTodayCount,
      totalDueTodayCount
    },
    habits: {
      allScheduledToday,
      completedTodayCount: completedHabitsCount,
      totalScheduledTodayCount
    },
    health: {
      todayLog: todayHealthLog,
      loggedMetricsCount
    },
    time: {
      focusSecondsToday
    },
    goals: {
      topActive: activeGoals
    },
    productivityScore: score
  };
}

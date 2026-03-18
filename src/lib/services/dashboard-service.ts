import { getTasks } from './task-service';
import { getHabits, getHabitLogs } from './habit-service';
import { getHealthLogs, getHealthGoals } from './health-service';
import { getTimeLogs } from './time-service';
import { getGoals } from './goal-service';
import { getScheduleForDate } from './planner-service';
import { Task } from '../types/task';
import { Habit } from '../types/habit';
import { HealthLog } from '../types/health';
import { GoalWithMilestones } from '../types/goal';
import { TimeBlock } from '../types/planner';
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
    loggedMetricsCount: number;
  };
  time: {
    focusSecondsToday: number;
    /** Minutes from completed planner blocks (non-break) */
    completedBlockMinutes: number;
    /** Completed blocks for the work-done card */
    completedBlocks: { startTime: string; endTime: string }[];
  };
  goals: {
    topActive: { goal: GoalWithMilestones; progress: number }[];
  };
  productivityScore: number;
}

function parseTimeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function getTodaySummary(): Promise<DashboardSummary> {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  const [allTasks, allHabits, habitLogs, healthLogs, timeLogs, allGoals, healthGoals, todayBlocks] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitLogs(),
    getHealthLogs(),
    getTimeLogs(start, end),
    getGoals(),
    getHealthGoals(),
    getScheduleForDate(today),
  ]);

  // --- TASKS ---
  const allDueToday = allTasks.filter(t =>
    t.status !== 'completed' ||
    (t.completed_at && isSameDay(parseISO(t.completed_at), today))
  );
  const completedTodayCount = allTasks.filter(t =>
    t.completed_at && isSameDay(parseISO(t.completed_at), today)
  ).length;
  const totalDueTodayCount = allDueToday.length;

  // --- HABITS ---
  const allScheduledToday = allHabits
    .filter(h => {
      if (h.frequency_type === 'daily') return true;
      if (h.frequency_type === 'weekdays') return h.frequency_days.includes(dayOfWeek);
      if (h.frequency_type === 'custom') return true;
      return true;
    })
    .map(h => {
      const log = habitLogs.find(l => l.habit_id === h.id && l.date === todayStr);
      return { ...h, isCompletedToday: log ? log.completed : false };
    });

  const completedHabitsCount = allScheduledToday.filter(h => h.isCompletedToday).length;
  const totalScheduledTodayCount = allScheduledToday.length;

  // --- HEALTH ---
  const todayHealthLog = healthLogs.find(l => l.date === todayStr) || null;
  let loggedMetricsCount = 0;
  if (todayHealthLog) {
    if ((todayHealthLog.sleep_hours ?? 0) >= healthGoals.sleep_hours_goal) loggedMetricsCount++;
    if ((todayHealthLog.water_intake ?? 0) >= healthGoals.water_intake_goal) loggedMetricsCount++;
    if ((todayHealthLog.steps ?? 0) >= healthGoals.steps_goal) loggedMetricsCount++;
    if (todayHealthLog.workout_done) loggedMetricsCount++;
  }

  // --- TIME (timer-based) ---
  const focusSecondsToday = timeLogs.reduce((sum, log) => sum + log.duration_seconds, 0);

  // --- PLANNER BLOCKS ---
  // Count ALL non-break completed blocks toward work done
  const completedBlocks = (todayBlocks as TimeBlock[])
    .filter(b => b.isCompleted && b.type !== 'break')
    .map(b => ({ startTime: b.startTime, endTime: b.endTime }));

  const completedBlockMinutes = completedBlocks.reduce((sum, b) => {
    return sum + Math.max(0, parseTimeToMins(b.endTime) - parseTimeToMins(b.startTime));
  }, 0);

  // Also add minutes from completed tasks that are NOT linked to a block
  // (to avoid double-counting, only count tasks whose IDs aren't in the schedule)
  const scheduledTaskIds = new Set(
    (todayBlocks as TimeBlock[]).filter(b => b.sourceId).map(b => b.sourceId!)
  );
  const completedUnlinkedTasks = allTasks.filter(t =>
    t.completed_at &&
    isSameDay(parseISO(t.completed_at), today) &&
    !scheduledTaskIds.has(t.id) &&
    t.estimated_minutes > 0
  );
  const unlinkedTaskMins = completedUnlinkedTasks.reduce((sum, t) => sum + t.estimated_minutes, 0);

  const totalWorkMins = completedBlockMinutes + unlinkedTaskMins;

  // --- GOALS ---
  const activeGoals = allGoals
    .filter(g => {
      const total = g.milestones.length;
      const completed = g.milestones.filter(m => m.is_completed).length;
      return total > 0 && completed < total;
    })
    .map(g => {
      const total = g.milestones.length;
      const completed = g.milestones.filter(m => m.is_completed).length;
      return { goal: g, progress: Math.round((completed / total) * 100) };
    })
    .slice(0, 3);

  // --- PRODUCTIVITY SCORE ---
  const taskRate = totalDueTodayCount > 0 ? completedTodayCount / totalDueTodayCount : 0;
  const habitRate = totalScheduledTodayCount > 0 ? completedHabitsCount / totalScheduledTodayCount : 0;
  let focusRate = Math.min(focusSecondsToday / 7200, 1);
  let healthRate = Math.min(loggedMetricsCount / 4, 1);
  const score = Math.round((taskRate * 30) + (habitRate * 30) + (focusRate * 20) + (healthRate * 20));

  return {
    tasks: { allDueToday, completedTodayCount, totalDueTodayCount },
    habits: { allScheduledToday, completedTodayCount: completedHabitsCount, totalScheduledTodayCount },
    health: { todayLog: todayHealthLog, loggedMetricsCount },
    time: {
      focusSecondsToday,
      completedBlockMinutes: totalWorkMins,
      completedBlocks,
    },
    goals: { topActive: activeGoals },
    productivityScore: score,
  };
}
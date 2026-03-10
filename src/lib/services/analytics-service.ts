import { getTasks } from './task-service';
import { getHabits, getHabitLogs } from './habit-service';
import { getHealthLogs } from './health-service';
import { getTimeLogs } from './time-service';
import { getGoals } from './goal-service';
import { subDays, startOfDay, endOfDay, isSameDay, differenceInMinutes, parseISO } from 'date-fns';

export interface AnalyticsData {
  score: number;
  scoreBreakdown: {
    tasks: number;
    habits: number;
    focus: number;
    health: number;
  };
  insights: {
    mostProductiveDay: string;
    averageSleep: string;
    habitSuccessRate: string;
  };
  charts: {
    tasksCompletedByDay: { date: string; count: number }[];
    focusTimeByDay: { date: string; hours: number }[];
    waterIntakeByDay: { date: string; amount: number }[];
    activeGoalsProgress: { title: string; progress: number }[];
  }
}

export async function getAnalyticsData(daysBack: number = 7): Promise<AnalyticsData> {
  const today = new Date();
  const startDate = startOfDay(subDays(today, daysBack - 1));
  const endDate = endOfDay(today);

  // 1. Fetch all raw data (in a real prod app with massive datasets, this would be highly optimized SQL views)
  const [tasks, habits, habitLogs, healthLogs, timeLogs, goals] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitLogs(),
    getHealthLogs(),
    getTimeLogs(startDate, endDate),
    getGoals()
  ]);

  // --- SCORE CALCULATION ALGORITHM ---
  // Max 100 points: 30 Tasks, 30 Habits, 20 Focus Time, 20 Health
  
  // Tasks Score (30 pts)
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const taskPoints = Math.round(taskRate * 30);

  // Habits Score (30 pts)
  // Simplified: ratio of logged habits in window vs (active habits * days)
  const windowHabitLogs = habitLogs.filter(l => {
    const d = parseISO(l.date);
    return d >= startDate && d <= endDate && l.completed;
  }).length;
  const expectedHabits = habits.length * daysBack;
  const habitRate = expectedHabits > 0 ? windowHabitLogs / expectedHabits : 0;
  const habitPoints = Math.round(habitRate * 30);

  // Focus Score (20 pts)
  // Target: say 2 hours/day average -> 7200 secs/day
  const totalFocusSecs = timeLogs.reduce((sum, log) => sum + log.duration_seconds, 0);
  const targetFocusSecs = daysBack * 2 * 3600; 
  let focusRate = targetFocusSecs > 0 ? totalFocusSecs / targetFocusSecs : 0;
  if (focusRate > 1) focusRate = 1; // Cap at 100% of target
  const focusPoints = Math.round(focusRate * 20);

  // Health Score (20 pts)
  // Simplified: Did they log health data in the window?
  const windowHealthLogs = healthLogs.filter(l => {
    const d = parseISO(l.date);
    return d >= startDate && d <= endDate;
  });
  const healthRate = windowHealthLogs.length / daysBack;
  const healthPoints = Math.round(healthRate * 20);

  const totalScore = taskPoints + habitPoints + focusPoints + healthPoints;

  // --- INSIGHTS GENERATION ---
  
  // Avg Sleep
  let totalSleep = 0;
  let sleepCount = 0;
  windowHealthLogs.forEach(l => {
    if (l.sleep_hours && l.sleep_hours > 0) {
      totalSleep += l.sleep_hours;
      sleepCount++;
    }
  });
  const avgSleep = sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) + " hrs" : "N/A";

  // Habit Success Rate formatted
  const habitSuccessText = expectedHabits > 0 ? Math.round(habitRate * 100) + "%" : "N/A";

  // Most Productive Day (by focus time in window)
  const focusByDayMap = new Map<string, number>();
  timeLogs.forEach(log => {
    const dayStr = log.start_time.split('T')[0];
    focusByDayMap.set(dayStr, (focusByDayMap.get(dayStr) || 0) + log.duration_seconds);
  });
  
  let bestDay = "N/A";
  let maxFocus = 0;
  focusByDayMap.forEach((secs, dateStr) => {
    if (secs > maxFocus) {
      maxFocus = secs;
      // Convert 'YYYY-MM-DD' to Day name
      const d = parseISO(dateStr);
      bestDay = d.toLocaleDateString('en-US', { weekday: 'long' });
    }
  });

  // --- CHARTS PREPARATION ---
  
  // 1. Tasks array generating
  // For simplicity, we track completion based on updatedAt IF status == completed
  const tasksCompletedByDayMap = new Map<string, number>();
tasks.filter(t => t.status === 'completed' && t.completed_at).forEach(t => {
  const dStr = t.completed_at!.split('T')[0];
    const d = parseISO(dStr);
    if (d >= startDate && d <= endDate) {
      tasksCompletedByDayMap.set(dStr, (tasksCompletedByDayMap.get(dStr) || 0) + 1);
    }
  });

  // Re-map into continuous day array
  const tasksCompletedByDay = [];
  const focusTimeByDay = [];
  const waterIntakeByDay = [];
  
  for (let i = 0; i < daysBack; i++) {
    const d = subDays(today, (daysBack - 1) - i);
    const dStr = d.toISOString().split('T')[0];
    const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Tasks
    tasksCompletedByDay.push({
      date: shortLabel,
      count: tasksCompletedByDayMap.get(dStr) || 0
    });
    
    // Focus
    const focusSecs = focusByDayMap.get(dStr) || 0;
    focusTimeByDay.push({
      date: shortLabel,
      hours: Number((focusSecs / 3600).toFixed(1))
    });
    
    // Water
    const hLog = healthLogs.find(l => l.date === dStr);
    waterIntakeByDay.push({
      date: shortLabel,
      amount: hLog ? hLog.water_intake : 0
    });
  }

  // Active Goals
  const activeGoalsProgress = goals.filter(g => {
    const total = g.milestones.length;
    const completed = g.milestones.filter(m => m.is_completed).length;
    return total > 0 && completed < total; // active and have milestones
  }).map(g => {
    const total = g.milestones.length;
    const completed = g.milestones.filter(m => m.is_completed).length;
    return {
      title: g.title.length > 15 ? g.title.substring(0, 15) + "..." : g.title,
      progress: Math.round((completed / total) * 100)
    };
  }).slice(0, 5); // top 5

  return {
    score: totalScore,
    scoreBreakdown: {
      tasks: taskPoints,
      habits: habitPoints,
      focus: focusPoints,
      health: healthPoints
    },
    insights: {
      mostProductiveDay: bestDay,
      averageSleep: avgSleep,
      habitSuccessRate: habitSuccessText
    },
    charts: {
      tasksCompletedByDay,
      focusTimeByDay,
      waterIntakeByDay,
      activeGoalsProgress
    }
  };
}

import { getTasks } from "./task-service";
import { getHabits, getHabitLogs, calculateHabitStats } from "./habit-service";
import { getTimeLogs } from "./time-service";
import { GamificationStats, AchievementBadge } from "../types/gamification";
import { startOfDay, subDays, format, parseISO, isSameDay } from "date-fns";

// Definition of our static badges
const BADGES_CONFIG: Omit<AchievementBadge, "isUnlocked" | "unlockedAt" | "progress">[] = [
  {
    id: "streak-7",
    title: "Starter Streak",
    description: "Hit a 7-day productivity streak",
    icon: "Flame",
    totalRequired: 7,
    colorClass: "text-orange-500 bg-orange-500/10 border-orange-500/20"
  },
  {
    id: "streak-30",
    title: "Monthly Master",
    description: "Hit a 30-day productivity streak",
    icon: "Calendar",
    totalRequired: 30,
    colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
  },
  {
    id: "tasks-100",
    title: "Centurion",
    description: "Complete 100 tasks overall",
    icon: "CheckCircle",
    totalRequired: 100,
    colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    id: "focus-50",
    title: "Deep Thinker",
    description: "Log 50 total hours of focus time",
    icon: "Brain",
    totalRequired: 50,
    colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/20"
  }
];

export async function getGamificationStats(): Promise<GamificationStats> {
  const today = new Date();
  
  // We need all time data for absolute achievements, and last 30/100 days for streaks/consistency
  const [allTasks, allHabitLogs, allTimeLogs] = await Promise.all([
    getTasks(),
    getHabitLogs(),
    getTimeLogs()
  ]);

  // --- 1. Productivity Streak & Consistency (Last 30 Days) ---
  const activeDaysMap = new Map<string, { tasks: number, habits: number, focusSecs: number }>();
  
  // Initialize last 60 days to be safe for streaks
  for (let i = 0; i < 60; i++) {
    activeDaysMap.set(format(subDays(today, i), 'yyyy-MM-dd'), { tasks: 0, habits: 0, focusSecs: 0 });
  }

  // Populate Tasks
  allTasks.filter(t => t.status === 'completed' && t.updated_at).forEach(t => {
    const dStr = t.updated_at!.split('T')[0];
    if (activeDaysMap.has(dStr)) activeDaysMap.get(dStr)!.tasks++;
  });

  // Populate Habits
  allHabitLogs.filter(l => l.completed).forEach(l => {
    if (activeDaysMap.has(l.date)) activeDaysMap.get(l.date)!.habits++;
  });

  // Populate Time
  allTimeLogs.forEach(l => {
    const dStr = l.start_time.split('T')[0];
    if (activeDaysMap.has(dStr)) activeDaysMap.get(dStr)!.focusSecs += l.duration_seconds;
  });

  // Calculate Streaks
  let prodStreak = 0;
  let focusStreak = 0;
  let active30DaysCount = 0; // Days with > 0 activity in last 30

  // We look backwards from yesterday to see the raw strict streak.
  // Actually, let's include today. If today is 0, streak pauses if yesterday >0, or breaks.
  // We will do a simple consecutive count looking backwards.
  for (let i = 0; i < 60; i++) {
    const day = activeDaysMap.get(format(subDays(today, i), 'yyyy-MM-dd'));
    if (!day) break;

    const hasProductivity = day.tasks > 0 || day.habits > 0 || day.focusSecs > 0;
    const hasFocus = day.focusSecs > 0;

    // Consistency (Last 30 days)
    if (i < 30 && hasProductivity) {
      active30DaysCount++;
    }

    // Productivity Streak Logic
    if (hasProductivity) {
      prodStreak++;
    } else {
      if (i === 0) {
        // Did not do anything yet today. Don't break the streak, just pause.
      } else {
        // Break!
        if (prodStreak > 0) break; // If we break after accumulating, we stop counting
      }
    }
  }

  // Same logic for focus streak (but isolated)
  for (let i = 0; i < 60; i++) {
    const day = activeDaysMap.get(format(subDays(today, i), 'yyyy-MM-dd'));
    if (!day) break;
    if (day.focusSecs > 0) {
      focusStreak++;
    } else {
      if (i > 0) break; 
    }
  }

  const consistencyScore = Math.round((active30DaysCount / 30) * 100);

  // --- 2. Habit Highest Streak ---
  const habits = await getHabits();
  let maxHabitStreak = 0;
  for (const h of habits) {
    const stats = calculateHabitStats(h, allHabitLogs);
    if (stats.currentStreak > maxHabitStreak) {
      maxHabitStreak = stats.currentStreak;
    }
  }

  // --- 3. Achievements Calculation ---
  const totalCompletedTasks = allTasks.filter(t => t.status === 'completed').length;
  const totalFocusHours = allTimeLogs.reduce((acc, l) => acc + l.duration_seconds, 0) / 3600;

  const achievements = BADGES_CONFIG.map(config => {
    let progress = 0;
    
    switch (config.id) {
      case "streak-7":
      case "streak-30":
        progress = prodStreak;
        break;
      case "tasks-100":
        progress = totalCompletedTasks;
        break;
      case "focus-50":
        progress = Math.round(totalFocusHours * 10) / 10; 
        break;
    }

    const isUnlocked = progress >= config.totalRequired!;

    return {
      ...config,
      progress: Math.min(progress, config.totalRequired!),
      isUnlocked,
      // If we had a database table for unlocks, we'd pull the date from there.
      // For now, if unlocked, we pretend it's unlocked today for simplicity.
      unlockedAt: isUnlocked ? new Date().toISOString() : undefined 
    };
  });


  return {
    consistencyScore,
    streaks: {
      habits: maxHabitStreak,
      productivity: prodStreak,
      focus: focusStreak
    },
    achievements
  };
}

import { getHabits, getHabitLogs } from "./habit-service";
import { getGamificationStats } from "./gamification-service";
import { HabitAnalyticsData, DailyCompletion } from "../types/habit-analytics";
import { parseISO, subDays, format, getDay, isAfter, isBefore, isEqual, startOfDay } from "date-fns";

const DAYS_OF_WEEK = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

export async function getAdvancedHabitAnalytics(daysToFetch: number = 30): Promise<HabitAnalyticsData | null> {
  const [habits, logs, gamification] = await Promise.all([
    getHabits(),
    getHabitLogs(),
    getGamificationStats()
  ]);

  if (!habits || habits.length === 0) return null;

  const today = startOfDay(new Date());
  const startDate = subDays(today, daysToFetch - 1); // e.g., 30 days ago to today

  let totalScheduledAllTime = 0;
  let totalCompletedAllTime = 0;
  
  const missedDaysCount = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat count of missed habits
  const dailyDataMap = new Map<string, DailyCompletion>();

  // Initialize the calendar map
  for (let i = 0; i < daysToFetch; i++) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    dailyDataMap.set(dateStr, {
      date: dateStr,
      completionRate: 0,
      totalCompleted: 0,
      totalScheduled: 0
    });
  }

  // Calculate day by day
  habits.forEach(habit => {
    const createdDate = startOfDay(parseISO(habit.created_at));

    for (let i = 0; i < daysToFetch; i++) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');

      // Skip if habit was created after this loop date
      if (isBefore(d, createdDate)) continue;

      let isScheduled = false;
      const dayOfWeek = getDay(d);

      if (habit.frequency_type === 'daily') isScheduled = true;
      if (habit.frequency_type === 'weekdays' && habit.frequency_days.includes(dayOfWeek)) isScheduled = true;
      if (habit.frequency_type === 'custom') isScheduled = true; // Simplified for custom for now

      if (isScheduled) {
        totalScheduledAllTime++;
        const dailyRecord = dailyDataMap.get(dateStr)!;
        dailyRecord.totalScheduled++;

        const log = logs.find(l => l.habit_id === habit.id && l.date === dateStr);
        if (log && log.completed) {
          totalCompletedAllTime++;
          dailyRecord.totalCompleted++;
        } else {
          // It was scheduled but missed
          missedDaysCount[dayOfWeek]++;
        }
      }
    }
  });

  // Calculate final daily completion rates
  const heatmapData = Array.from(dailyDataMap.values()).map(d => {
    d.completionRate = d.totalScheduled === 0 ? 0 : Math.round((d.totalCompleted / d.totalScheduled) * 100);
    return d;
  }).sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

  // 1. Success Rate
  const successRate = totalScheduledAllTime === 0 ? 0 : Math.round((totalCompletedAllTime / totalScheduledAllTime) * 100);

  // 2. Failure Pattern
  let worstDayIndex = 0;
  let maxMisses = 0;
  for (let i = 0; i < 7; i++) {
    if (missedDaysCount[i] > maxMisses) {
      maxMisses = missedDaysCount[i];
      worstDayIndex = i;
    }
  }
  const failurePattern = maxMisses > 1 
    ? `You miss habits mostly on ${DAYS_OF_WEEK[worstDayIndex]}.` 
    : (successRate === 100 ? `Perfect consistency in this period!` : `No clear failure pattern detected yet.`);

  // 3. Streak Prediction
  // Find highest current streak vs historical max across all habits
  let currentMax = 0;
  let allTimeMax = 0;

  habits.forEach(habit => {
  const habitLogs = logs
    .filter(l => l.habit_id === habit.id && l.completed)
    .map(l => l.date)
    .sort();
    let current = 0;
  let longest = 0;
  let streak = 0;
  let prev: string | null = null;

  for (const dateStr of habitLogs) {
    if (prev) {
      const diff = Math.round((new Date(dateStr).getTime() - new Date(prev).getTime()) / 86400000);
      streak = diff === 1 ? streak + 1 : 1;
    } else {
      streak = 1;
    }
    longest = Math.max(longest, streak);
    prev = dateStr;
  }
   let d = new Date();
  current = 0;
  while (true) {
    const ds = format(d, 'yyyy-MM-dd');
    if (habitLogs.includes(ds)) { current++; d = subDays(d, 1); }
    else break;
  }

  if (current > currentMax) currentMax = current;
  if (longest > allTimeMax) allTimeMax = longest;
});
  let streakPrediction = "Keep building those habits!";
  if (currentMax > 0 && currentMax < allTimeMax) {
    const diff = allTimeMax - currentMax;
    streakPrediction = `If you remain consistent for ${diff + 1} more days, you'll break your longest streak record!`;
  } else if (currentMax > 0 && currentMax >= allTimeMax) {
    streakPrediction = `You are currently on your longest streak ever! (${currentMax} days)`;
  }

  return {
    successRate,
    failurePattern,
    streakPrediction,
    heatmapData: heatmapData,
    consistencyData: heatmapData // For line chart 
  };
}

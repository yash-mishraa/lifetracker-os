import { PersonalRecord } from "@/lib/types/records";
import { getHabits, getHabitLogs } from "./habit-service";
import { getTasks } from "./task-service";
import { getTimeLogs } from "./time-service";
import { getGoals } from "./goal-service";
import { getHealthLogs } from "./health-service";

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const [
    longestHabitStreak,
    mostFocusHours,
    mostTasksCompleted,
    bestDisciplineScore
  ] = await Promise.all([
    calculateLongestHabitStreak(),
    calculateMostFocusHours(),
    calculateMostTasksCompleted(),
    calculateBestDisciplineScore()
  ]);

  return [
    longestHabitStreak,
    mostFocusHours,
    mostTasksCompleted,
    bestDisciplineScore
  ];
}

async function calculateLongestHabitStreak(): Promise<PersonalRecord> {
  const [habits, logs] = await Promise.all([getHabits(), getHabitLogs()]);

  let maxStreak = 0;
  let bestHabitName = "Any Habit";
  let maxDate: string | null = null;

  // Group logs by habit_id
  const logsByHabit = logs.reduce((acc, log) => {
    if (!acc[log.habit_id]) acc[log.habit_id] = [];
    acc[log.habit_id].push(log);
    return acc;
  }, {} as Record<string, typeof logs>);

  for (const habit of habits) {
    const habitLogs = logsByHabit[habit.id] || [];
    const completedDates = habitLogs
      .filter((l) => l.completed)
      .map((l) => l.date)
      .sort();

    if (completedDates.length === 0) continue;

    let currentStreak = 1;
    let localMaxStreak = 1;
    let localMaxDate = completedDates[0];

    for (let i = 1; i < completedDates.length; i++) {
      const prevDate = new Date(completedDates[i - 1]);
      const currDate = new Date(completedDates[i]);
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > localMaxStreak) {
          localMaxStreak = currentStreak;
          localMaxDate = completedDates[i];
        }
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }

    if (localMaxStreak > maxStreak) {
      maxStreak = localMaxStreak;
      bestHabitName = habit.name;
      maxDate = localMaxDate;
    }
  }

  return {
    id: "longest_habit_streak",
    title: "Longest Habit Streak",
    value: maxStreak,
    unit: "days",
    date_achieved: maxDate,
    description: "Your best uninterrupted streak for a single habit.",
    related_item_name: bestHabitName,
  };
}

async function calculateMostFocusHours(): Promise<PersonalRecord> {
  const logs = await getTimeLogs(); // all time
  
  const focusByDay = logs.reduce((acc, log) => {
    // start_time is ISO string. Extract local date part (YYYY-MM-DD):
    const date = log.start_time.split("T")[0];
    if (!acc[date]) acc[date] = 0;
    acc[date] += log.duration_seconds;
    return acc;
  }, {} as Record<string, number>);

  let maxSeconds = 0;
  let maxDate: string | null = null;

  for (const [date, seconds] of Object.entries(focusByDay)) {
    if (seconds > maxSeconds) {
      maxSeconds = seconds;
      maxDate = date;
    }
  }

  const hours = Math.round((maxSeconds / 3600) * 10) / 10; // 1 decimal

  return {
    id: "most_focus_hours",
    title: "Most Focus in a Day",
    value: hours,
    unit: "hours",
    date_achieved: maxDate,
    description: "The most cumulative time you spent in deep focus in a single day.",
  };
}

async function calculateMostTasksCompleted(): Promise<PersonalRecord> {
  const tasks = await getTasks();

  const completedTasks = tasks.filter(t => t.status === "completed" && t.completed_at);
  
  const tasksByDay = completedTasks.reduce((acc, task) => {
    const date = task.completed_at!.split("T")[0];
    if (!acc[date]) acc[date] = 0;
    acc[date]++;
    return acc;
  }, {} as Record<string, number>);

  let maxCount = 0;
  let maxDate: string | null = null;

  for (const [date, count] of Object.entries(tasksByDay)) {
    if (count > maxCount) {
      maxCount = count;
      maxDate = date;
    }
  }

  return {
    id: "most_tasks_completed",
    title: "Most Tasks Completed",
    value: maxCount,
    unit: "tasks",
    date_achieved: maxDate,
    description: "The highest number of tasks you have fully checked off in a single day.",
  };
}

async function calculateBestDisciplineScore(): Promise<PersonalRecord> {
  // A simplified daily discipline historical scanner
  const [tasks, habitLogs, timeLogs] = await Promise.all([
    getTasks(),
    getHabitLogs(),
    getTimeLogs()
  ]);

  const days: Record<string, { tasks: number, habits: number, focusSeconds: number }> = {};
  
  tasks.filter(t => t.status === "completed" && t.completed_at).forEach(t => {
    const d = t.completed_at!.split("T")[0];
    if (!days[d]) days[d] = { tasks: 0, habits: 0, focusSeconds: 0 };
    days[d].tasks++;
  });

  habitLogs.filter(l => l.completed).forEach(l => {
    const d = l.date;
    if (!days[d]) days[d] = { tasks: 0, habits: 0, focusSeconds: 0 };
    days[d].habits++;
  });

  timeLogs.forEach(l => {
    const d = l.start_time.split("T")[0];
    if (!days[d]) days[d] = { tasks: 0, habits: 0, focusSeconds: 0 };
    days[d].focusSeconds += l.duration_seconds;
  });

  let maxScore = 0;
  let maxDate: string | null = null;

  for (const [date, stats] of Object.entries(days)) {
    // Arbitrary 100-point scale: 
    // - 3 tasks = 30 pts (max)
    // - 3 habits = 30 pts (max)
    // - 2 hours focus = 40 pts (max)
    const taskScore = Math.min((stats.tasks / 3) * 30, 30);
    const habitScore = Math.min((stats.habits / 3) * 30, 30);
    const focusScore = Math.min((stats.focusSeconds / 7200) * 40, 40);

    const total = Math.round(taskScore + habitScore + focusScore);
    if (total > maxScore) {
      maxScore = total;
      maxDate = date;
    }
  }

  return {
    id: "best_discipline_score",
    title: "Best Discipline Score",
    value: maxScore,
    unit: "pts",
    date_achieved: maxDate,
    description: "Your highest combined daily productivity score.",
  };
}

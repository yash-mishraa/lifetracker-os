import { getTasks } from "./task-service";
import { getHabits, getHabitLogs } from "./habit-service";
import { getHealthLogs } from "./health-service";
import { getGoals } from "./goal-service";
import { AppNotification } from "../types/notification";
import { isSameDay, parseISO, isPast, isToday, addDays, getHours } from "date-fns";

export async function getPendingReminders(): Promise<AppNotification[]> {
  const notifications: AppNotification[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeek = today.getDay();

  // Fetch all data
  const [tasks, habits, habitLogs, healthLogs, goals] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitLogs(),
    getHealthLogs(),
    getGoals()
  ]);

  // --- 1. Tasks ---
  tasks.forEach(task => {
    if (task.status !== 'completed' && task.deadline) {
      const dueDate = parseISO(task.deadline);
      // Is due today?
      if (isSameDay(dueDate, today)) {
        notifications.push({
          id: `task-${task.id}`,
          type: "task",
          title: "Task Due Today",
          message: `${task.title} is due today.`,
          actionUrl: "/tasks",
          isRead: false
        });
      } else if (isPast(dueDate) && !isSameDay(dueDate, today)) {
        // Overdue from previous day
        notifications.push({
          id: `task-${task.id}`,
          type: "task",
          title: "Overdue Task",
          message: `${task.title} was due on ${task.deadline}.`,
          actionUrl: "/tasks",
          isRead: false
        });
      }
    }
  });

  // --- 2. Habits ---
  habits.forEach(habit => {
    // Check if scheduled for today
    let scheduledToday = false;
    if (habit.frequency_type === 'daily') scheduledToday = true;
    if (habit.frequency_type === 'weekdays' && habit.frequency_days.includes(dayOfWeek)) scheduledToday = true;
    if (habit.frequency_type === 'custom') scheduledToday = true;

    if (scheduledToday) {
      const log = habitLogs.find(l => l.habit_id === habit.id && l.date === todayStr);
      const isCompleted = log ? log.completed : false;

      if (!isCompleted && habit.reminder_time) {
        // Check if reminder time has passed
        const [h, m] = habit.reminder_time.split(':').map(Number);
        const reminderTime = new Date(today);
        reminderTime.setHours(h, m, 0, 0);

        if (isPast(reminderTime)) {
          notifications.push({
            id: `habit-${habit.id}`,
            type: "habit",
            title: "Habit Reminder",
            message: `Time to do: ${habit.name}`,
            time: habit.reminder_time,
            actionUrl: "/habits",
            isRead: false
          });
        }
      }
    }
  });

  // --- 3. Health ---
  const currentHour = getHours(today);
  if (currentHour >= 20) { // After 8 PM
    const todayLog = healthLogs.find(l => l.date === todayStr);
    if (!todayLog) {
      notifications.push({
        id: `health-daily`,
        type: "health",
        title: "Daily Health Check-in",
        message: "Don't forget to log your sleep, hydration, and mood today!",
        actionUrl: "/health",
        isRead: false
      });
    }
  }

  // --- 4. Goals ---
  const threeDaysFromNow = addDays(today, 3);
  goals.forEach(goal => {
    const isGoalIncomplete = goal.milestones.some(m => !m.is_completed) || goal.milestones.length === 0;
    
    if (isGoalIncomplete && goal.target_date) {
      const targetDate = parseISO(goal.target_date);
      // If it's in the past or within 3 days
      if (isPast(targetDate) || targetDate <= threeDaysFromNow) {
         notifications.push({
          id: `goal-${goal.id}`,
          type: "goal",
          title: isPast(targetDate) ? "Overdue Goal" : "Upcoming Goal Deadline",
          message: `Goal "${goal.title}" is targeted for ${goal.target_date}.`,
          actionUrl: "/goals",
          isRead: false
        });
      }
    }
  });

  return notifications;
}

export type NotificationType = "task" | "habit" | "health" | "goal";

export interface AppNotification {
  id: string; // Unique identifier (e.g., 'task-id', 'habit-id')
  type: NotificationType;
  title: string;
  message: string;
  time?: string; // e.g., "14:00" or ISO string
  actionUrl: string; // the path to navigate when clicked
  isRead: boolean;
}

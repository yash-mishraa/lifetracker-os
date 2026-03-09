"use client";

import { Task, PRIORITY_CONFIG, Priority } from "@/lib/types/task";
import { TaskCard } from "./task-card";
import { isToday, isPast } from "date-fns";
import { AlertCircle, CalendarDays, Sun } from "lucide-react";

interface TaskTodayViewProps {
  tasks: Task[];
  subtasksMap: Record<string, Task[]>;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskTodayView({
  tasks,
  subtasksMap,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskTodayViewProps) {
  const overdueTasks = tasks.filter(
    (t) =>
      t.deadline &&
      isPast(new Date(t.deadline)) &&
      !isToday(new Date(t.deadline)) &&
      t.status !== "completed"
  );

  const todayTasks = tasks.filter(
    (t) =>
      t.deadline &&
      isToday(new Date(t.deadline))
  );

  const noDeadlineTasks = tasks.filter(
    (t) => !t.deadline && t.status !== "completed"
  );

  const priorityOrder: Priority[] = ["critical", "high", "medium", "low"];
  const sortByPriority = (a: Task, b: Task) =>
    priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);

  const isEmpty =
    overdueTasks.length === 0 &&
    todayTasks.length === 0 &&
    noDeadlineTasks.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sun className="h-12 w-12 text-amber-400/40 mb-4" />
        <p className="text-sm text-muted-foreground">All clear for today!</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          No tasks due today or overdue
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">
              Overdue ({overdueTasks.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.sort(sortByPriority).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                subtasks={subtasksMap[task.id] || []}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      {todayTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold">
              Due Today ({todayTasks.length})
            </h3>
          </div>
          <div className="space-y-2">
            {todayTasks.sort(sortByPriority).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                subtasks={subtasksMap[task.id] || []}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}

      {/* No deadline */}
      {noDeadlineTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              No Deadline ({noDeadlineTasks.length})
            </h3>
          </div>
          <div className="space-y-2">
            {noDeadlineTasks.sort(sortByPriority).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                subtasks={subtasksMap[task.id] || []}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { Task } from "@/lib/types/task";
import { TaskCard } from "./task-card";
import { CheckSquare } from "lucide-react";

interface TaskListViewProps {
  tasks: Task[];
  subtasksMap: Record<string, Task[]>;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskListView({
  tasks,
  subtasksMap,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No tasks found</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Create a task to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
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
  );
}

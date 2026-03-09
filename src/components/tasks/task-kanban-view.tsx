"use client";

import { Task, STATUS_CONFIG, TaskStatus } from "@/lib/types/task";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskKanbanViewProps {
  tasks: Task[];
  subtasksMap: Record<string, Task[]>;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "completed", "blocked"];

export function TaskKanbanView({
  tasks,
  subtasksMap,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskKanbanViewProps) {
  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((status) => {
        const columnTasks = getColumnTasks(status);
        const cfg = STATUS_CONFIG[status];

        return (
          <div key={status} className="space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    status === "todo" && "bg-slate-400",
                    status === "in_progress" && "bg-blue-400",
                    status === "completed" && "bg-emerald-400",
                    status === "blocked" && "bg-red-400"
                  )}
                />
                <h3 className="text-sm font-semibold">{cfg.label}</h3>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {columnTasks.length}
              </Badge>
            </div>

            {/* Column Content */}
            <div className="space-y-2 min-h-[100px] rounded-lg border border-dashed p-2 bg-muted/20">
              {columnTasks.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-xs text-muted-foreground/50">No tasks</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    subtasks={subtasksMap[task.id] || []}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

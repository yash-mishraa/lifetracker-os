"use client";

import { useState } from "react";
import {
  Task,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  Priority,
  TaskStatus,
} from "@/lib/types/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  CalendarDays,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Repeat,
  ListTree,
  Play,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TaskCardProps {
  task: Task;
  subtasks?: Task[];
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({
  task,
  subtasks = [],
  onToggleComplete,
  onEdit,
  onDelete,
  compact = false,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const statusCfg = STATUS_CONFIG[task.status];
  const isCompleted = task.status === "completed";
  const isOverdue =
    task.deadline && isPast(new Date(task.deadline)) && !isCompleted;
  const isDueToday =
    task.deadline && isToday(new Date(task.deadline)) && !isCompleted;
  const completedSubtasks = subtasks.filter(
    (s) => s.status === "completed"
  ).length;

  return (
    <motion.div
      layout
      animate={{ 
        backgroundColor: isCompleted ? "var(--emerald-500-10)" : "var(--card)",
        borderColor: isCompleted ? "var(--emerald-500-20)" : "var(--border)"
      }}
      transition={{ duration: 0.5 }}
      style={{
        '--emerald-500-10': 'rgba(16, 185, 129, 0.05)',
        '--emerald-500-20': 'rgba(16, 185, 129, 0.2)',
        '--card': 'hsl(var(--card))',
        '--border': 'hsl(var(--border))'
      } as any}
      className={cn(
        "group rounded-[calc(var(--radius)+4px)] border p-3 transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5",
        isCompleted && "opacity-75 blur-[0.3px] grayscale-[0.2]",
        isOverdue && "border-red-500/30"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <motion.div whileTap={{ scale: 0.8 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggleComplete(task)}
            className="mt-0.5 rounded-full"
          />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "text-sm font-medium leading-tight",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h4>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
               {!isCompleted && !compact && (
                 <Link href={`/deep-work?taskId=${task.id}`} className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted">
                    <Play className="h-3.5 w-3.5" />
                 </Link>
               )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-xs" />
                  }
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(task)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          {!compact && task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Priority */}
            <Badge variant="secondary" className={cn("text-[10px] gap-1 px-1.5 py-0", priorityCfg.bgColor, priorityCfg.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", priorityCfg.dotColor)} />
              {priorityCfg.label}
            </Badge>

            {/* Status (if not obvious from context) */}
            {!compact && (
              <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", statusCfg.bgColor, statusCfg.color)}>
                {statusCfg.label}
              </Badge>
            )}

            {/* Deadline */}
            {task.deadline && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px]",
                  isOverdue
                    ? "text-red-400"
                    : isDueToday
                    ? "text-amber-400"
                    : "text-muted-foreground"
                )}
              >
                <CalendarDays className="h-3 w-3" />
                {format(new Date(task.deadline), "MMM d")}
              </span>
            )}

            {/* Estimated time */}
            {task.estimated_minutes > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.estimated_minutes}m
              </span>
            )}

            {/* Recurrence */}
            {task.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-violet-400">
                <Repeat className="h-3 w-3" />
                {task.recurrence}
              </span>
            )}

            {/* Subtask count */}
            {subtasks.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ListTree className="h-3 w-3" />
                {completedSubtasks}/{subtasks.length}
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded subtasks */}
      {expanded && subtasks.length > 0 && (
        <div className="mt-3 ml-7 space-y-1.5 border-l-2 border-muted pl-3">
          {subtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2">
              <Checkbox
                checked={sub.status === "completed"}
                onCheckedChange={() => onToggleComplete(sub)}
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  "text-xs",
                  sub.status === "completed" &&
                    "line-through text-muted-foreground"
                )}
              >
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

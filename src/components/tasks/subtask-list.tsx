"use client";

import { useState } from "react";
import { Task } from "@/lib/types/task";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubtaskListProps {
  subtasks: Task[];
  onToggle: (subtask: Task) => void;
  onAdd: (title: string) => void;
  onDelete: (subtask: Task) => void;
}

export function SubtaskList({
  subtasks,
  onToggle,
  onAdd,
  onDelete,
}: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim());
      setNewTitle("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewTitle("");
    }
  };

  const completed = subtasks.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Subtasks {subtasks.length > 0 && `(${completed}/${subtasks.length})`}
        </span>
        {!isAdding && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsAdding(true)}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {subtasks.length > 0 && (
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${(completed / subtasks.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Subtask items */}
      <div className="space-y-1">
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="group/sub flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <Checkbox
              checked={sub.status === "completed"}
              onCheckedChange={() => onToggle(sub)}
              className="h-3.5 w-3.5"
            />
            <span
              className={cn(
                "flex-1 text-xs",
                sub.status === "completed" &&
                  "line-through text-muted-foreground"
              )}
            >
              {sub.title}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(sub)}
              className="opacity-0 group-hover/sub:opacity-100 transition-opacity h-5 w-5"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add subtask input */}
      {isAdding && (
        <div className="flex gap-2">
          <Input
            placeholder="Subtask title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-7 text-xs"
          />
          <Button size="xs" onClick={handleAdd} disabled={!newTitle.trim()}>
            Add
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setIsAdding(false);
              setNewTitle("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

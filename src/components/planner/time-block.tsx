"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimeBlock } from "@/lib/types/planner";
import { GripVertical, Clock, CheckCircle2, Lock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TimeBlockItemProps {
  block: TimeBlock;
  onToggleComplete?: (id: string, isCompleted: boolean) => void;
}

export function TimeBlockItem({ block, onToggleComplete }: TimeBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: block.isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getThemeVars = () => {
    if (block.isCompleted) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
    if (block.isLocked) return "bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-400";
    
    switch (block.type) {
      case 'task':
        if (block.energyLevel === 'High') return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
        if (block.energyLevel === 'Medium') return "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400";
        return "bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-400";
      case 'habit':
        return "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400";
      case 'focus':
        return "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400";
      case 'break':
        return "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400";
      default:
        return "bg-card border-border text-foreground";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex items-stretch border rounded-lg overflow-hidden group mb-3 shadow-xs",
        getThemeVars(),
        isDragging && "opacity-50 scale-95 ring-2 ring-primary z-50 shadow-xl",
        block.isCompleted && "opacity-60"
      )}
    >
      {/* Drag Handle */}
      {!block.isLocked && (
        <div
          className="flex items-center px-1 border-r border-inherit bg-black/5 dark:bg-white/5 cursor-grab active:cursor-grabbing hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 opacity-50" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className={cn("text-sm font-semibold truncate", block.isCompleted && "line-through")}>
              {block.title}
            </h4>
            {block.description && (
              <p className="text-xs opacity-70 truncate mt-0.5">{block.description}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center text-xs font-medium bg-background/50 px-1.5 py-0.5 rounded border border-inherit shadow-sm">
              <Clock className="h-3 w-3 mr-1 opacity-70" />
              {block.startTime} - {block.endTime}
            </div>
            
            <div className="flex items-center gap-1">
              {block.type === 'habit' && <Flame className="h-3 w-3 opacity-70" />}
              {block.isLocked && <Lock className="h-3 w-3 opacity-70" />}
              {block.energyLevel === 'High' && (
                <Badge variant="outline" className="text-[9px] h-4 px-1 border-inherit bg-background/50 uppercase tracking-wider">Deep Work</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action (Complete/Uncomplete for tasks and habits) */}
      {(block.type === 'task' || block.type === 'habit') && onToggleComplete && (
        <button
          onClick={() => onToggleComplete(block.id, !block.isCompleted)}
          className="px-3 flex items-center justify-center border-l border-inherit bg-background/20 hover:bg-background/40 transition-colors group/btn"
        >
          <CheckCircle2 className={cn("h-5 w-5 transition-all", block.isCompleted ? "text-emerald-500 fill-emerald-500/20" : "opacity-30 group-hover/btn:opacity-100")} />
        </button>
      )}
    </div>
  );
}

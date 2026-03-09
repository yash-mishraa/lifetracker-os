"use client";

import { useState } from "react";
import { Habit, HabitLog, HabitStats } from "@/lib/types/habit";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, MoreHorizontal, Check, Edit2, Trash2, CalendarDays } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, subDays, startOfDay } from "date-fns";

interface HabitCardProps {
  habit: Habit;
  stats: HabitStats;
  logs: HabitLog[];
  onToggle: (habit: Habit, dateStr: string, completed: boolean) => void;
  onUpdateValue: (habit: Habit, dateStr: string, value: number) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  onShowHeatmap: (habit: Habit) => void;
}

export function HabitCard({
  habit,
  stats,
  logs,
  onToggle,
  onUpdateValue,
  onEdit,
  onDelete,
  onShowHeatmap,
}: HabitCardProps) {
  // Generate last 7 days
  const today = startOfDay(new Date());
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(today, 6 - i);
    return format(d, "yyyy-MM-dd");
  });

  const getLogForDate = (dateStr: string) => logs.find((l) => l.date === dateStr);

  const handleCellClick = (dateStr: string) => {
    if (habit.type === "binary") {
      const log = getLogForDate(dateStr);
      onToggle(habit, dateStr, !!log?.completed);
    }
  };

  const QuantitativePopover = ({ dateStr, log }: { dateStr: string; log?: HabitLog }) => {
    const [val, setVal] = useState(log?.value?.toString() || "");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateValue(habit, dateStr, parseInt(val) || 0);
    };

    return (
      <Popover>
        <PopoverTrigger 
          render={
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold transition-colors border shadow-xs
                ${log?.completed ? 'border-transparent text-white ring-2 ring-primary/20 ring-offset-1 ring-offset-background' : 'border-dashed border-muted-foreground/30 hover:bg-muted text-muted-foreground'}
              `}
              style={{ backgroundColor: log?.completed ? habit.color : 'transparent' }}
            />
          }
        >
          {log?.completed ? <Check className="h-4 w-4" /> : (log?.value ? log.value : '')}
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3" side="top">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Label className="text-xs">
              Progress on {format(new Date(dateStr), "MMM d")}
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                size={1}
                className="h-8 text-sm"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                min={0}
                placeholder={`/ ${habit.target_value}`}
              />
              <Button type="submit" size="sm" className="h-8">Save</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/60 backdrop-blur-xl group overflow-hidden">
      <CardHeader className="p-5 pb-3 flex flex-row items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 shadow-sm bg-background/50 backdrop-blur border w-fit px-2 py-0.5 rounded-full">
            <span
              className="w-1.5 h-1.5 rounded-full shadow-sm"
              style={{ backgroundColor: habit.color }}
            />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {habit.category}
            </span>
          </div>
          <h3 className="font-heading font-bold text-xl leading-tight tracking-tight mt-1">{habit.name}</h3>
          
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1" title="Current Streak">
              <Flame className={`h-3 w-3 ${stats.currentStreak > 0 ? 'text-orange-500' : ''}`} />
              <span className={stats.currentStreak > 0 ? 'text-orange-500 font-medium' : ''}>
                {stats.currentStreak}
              </span>
            </div>
            {habit.type === "quantitative" && (
              <span className="bg-muted px-1.5 py-0.5 rounded">
                Target: {habit.target_value}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 -mt-2 -mr-2">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onShowHeatmap(habit)}>
              <CalendarDays className="h-4 w-4 mr-2" />
              View Heatmap
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(habit)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Habit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10"
              onClick={() => onDelete(habit)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="flex justify-between items-center mt-3">
          {last7Days.map((dateStr, idx) => {
            const log = getLogForDate(dateStr);
            const isToday = idx === 6;
            const d = new Date(dateStr);

            return (
              <div key={dateStr} className="flex flex-col items-center gap-1.5">
                <span className={`text-[10px] uppercase font-medium ${isToday ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                  {format(d, "EEEE").charAt(0)}
                </span>
                
                {habit.type === "binary" ? (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCellClick(dateStr)}
                    className={`relative w-8 h-8 rounded-md flex items-center justify-center transition-colors border shadow-xs
                      ${log?.completed 
                        ? 'border-transparent text-white ring-2 ring-primary/20 ring-offset-1 ring-offset-background' 
                        : 'border-dashed border-muted-foreground/30 hover:bg-muted/80 hover:border-solid hover:border-primary/50'
                      }
                    `}
                    style={{ backgroundColor: log?.completed ? habit.color : 'transparent' }}
                  >
                    <AnimatePresence>
                      {log?.completed && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <Check className="h-4 w-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ) : (
                  <QuantitativePopover dateStr={dateStr} log={log} />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

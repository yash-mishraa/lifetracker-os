"use client";

import { useState, useEffect } from "react";
import { Routine, RoutineStep, RoutineStats } from "@/lib/types/routine";
import { getRoutineSteps, getRoutineLogByDate, updateRoutineLog, getRoutineStats } from "@/lib/services/routine-service";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Flame, Droplets, BookOpen, Sun, Moon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface RoutineChecklistProps {
  routine: Routine;
  date: string;
}

export function RoutineChecklist({ routine, date }: RoutineChecklistProps) {
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<RoutineStats>({ currentStreak: 0, longestStreak: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [routine.id, date]);

  async function loadData() {
    try {
      setLoading(true);
      const [fetchedSteps, log, fetchedStats] = await Promise.all([
        getRoutineSteps(routine.id),
        getRoutineLogByDate(routine.id, date),
        getRoutineStats(routine.id)
      ]);
      
      setSteps(fetchedSteps);
      setStats(fetchedStats);
      if (log) {
        setCompletedStepIds(new Set(log.completed_step_ids));
      } else {
        setCompletedStepIds(new Set());
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStep(stepId: string, checked: boolean) {
    const newCompleted = new Set(completedStepIds);
    if (checked) {
      newCompleted.add(stepId);
    } else {
      newCompleted.delete(stepId);
    }
    setCompletedStepIds(newCompleted);

    try {
      await updateRoutineLog(routine.id, date, Array.from(newCompleted), steps.length);
      // Reload stats silently to update streak if they just finished the last item
      if (newCompleted.size === steps.length) {
        toast({ title: "Routine complete!", description: "Great job forming the habit." });
        const newStats = await getRoutineStats(routine.id);
        setStats(newStats);
      }
    } catch (err: any) {
      toast({ title: "Error saving log", description: err.message, variant: "destructive" });
      // Revert optimism
      setCompletedStepIds(completedStepIds);
    }
  }

  const getIcon = () => {
    switch (routine.type) {
      case "morning": return <Sun className="h-5 w-5 text-amber-500" />;
      case "night": return <Moon className="h-5 w-5 text-indigo-400" />;
      default: return <Droplets className="h-5 w-5 text-emerald-400" />;
    }
  };

  const isFullyCompleted = steps.length > 0 && completedStepIds.size === steps.length;
  const progressPercent = steps.length > 0 ? Math.round((completedStepIds.size / steps.length) * 100) : 0;

  return (
    <Card className={cn("transition-colors duration-300", isFullyCompleted && "border-primary/50 bg-primary/5")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <div>
              <CardTitle className="text-lg">{routine.title}</CardTitle>
              <CardDescription>
                {completedStepIds.size} of {steps.length} completed
              </CardDescription>
            </div>
          </div>
          {stats.currentStreak > 0 && (
            <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">
              <Flame className="h-3 w-3" />
              {stats.currentStreak} Day Streak
            </Badge>
          )}
        </div>
        
        {steps.length > 0 && (
          <div className="w-full bg-secondary h-1.5 rounded-full mt-4 overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", isFullyCompleted ? "bg-primary" : "bg-muted-foreground")}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : steps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No steps added to this routine yet.</p>
        ) : (
          <div className="space-y-3 mt-2">
            {steps.map((step) => {
              const checked = completedStepIds.has(step.id);
              return (
                <div 
                  key={step.id} 
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md transition-colors",
                    checked ? "opacity-60 bg-muted/50" : "hover:bg-muted"
                  )}
                >
                  <Checkbox 
                    id={step.id}
                    checked={checked}
                    onCheckedChange={(c) => handleToggleStep(step.id, c as boolean)}
                    className={cn("h-5 w-5 rounded-full transition-all")}
                  />
                  <label 
                    htmlFor={step.id}
                    className={cn(
                      "text-sm font-medium cursor-pointer flex-1 transition-all",
                      checked && "line-through text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

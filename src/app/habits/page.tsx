"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Habit, HabitLog, HabitFormData, HabitStats } from "@/lib/types/habit";
import {
  getHabits,
  getHabitLogs,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  updateHabitValue,
  calculateHabitStats,
} from "@/lib/services/habit-service";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { HabitStatsOverview } from "@/components/habits/habit-stats-overview";
import { HabitMonthlyHeatmap } from "@/components/habits/habit-monthly-heatmap";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Heatmap modal state
  const [heatmapHabit, setHeatmapHabit] = useState<Habit | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [hData, lData] = await Promise.all([getHabits(), getHabitLogs()]);
      setHabits(hData);
      setLogs(lData);
    } catch (err) {
      console.error("Failed to load habits info:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Stats
  const habitStatsMap = useMemo(() => {
    const map: Record<string, HabitStats> = {};
    habits.forEach((h) => {
      map[h.id] = calculateHabitStats(h, logs);
    });
    return map;
  }, [habits, logs]);

  const globalStats = useMemo(() => {
    if (habits.length === 0) return { total: 0, avgRate: 0, bestOverall: 0, currOverall: 0 };
    let best = 0;
    let curr = 0;
    let totalRate = 0;
    
    Object.values(habitStatsMap).forEach(s => {
      if (s.longestStreak > best) best = s.longestStreak;
      if (s.currentStreak > curr) curr = s.currentStreak;
      totalRate += s.completionRate;
    });

    return {
      total: habits.length,
      avgRate: Math.round(totalRate / habits.length),
      bestOverall: best,
      currOverall: curr,
    };
  }, [habits.length, habitStatsMap]);

  // Handlers
  const handleCreateOrUpdate = async (data: HabitFormData) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, data);
    } else {
      await createHabit(data);
    }
    setEditingHabit(null);
    loadData();
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleDelete = async (habit: Habit) => {
    if (confirm(`Are you sure you want to delete "${habit.name}" and all its logs?`)) {
      await deleteHabit(habit.id);
      loadData();
    }
  };

  const handleToggle = async (habit: Habit, dateStr: string, completed: boolean) => {
    // Optimistic UI update
    const isNowCompleted = !completed;
    const value = isNowCompleted ? habit.target_value : 0;
    const newLog = { habit_id: habit.id, date: dateStr, completed: isNowCompleted, value } as HabitLog;
    
    setLogs(prev => {
      const idx = prev.findIndex(l => l.habit_id === habit.id && l.date === dateStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], completed: isNowCompleted, value };
        return copy;
      }
      return [...prev, newLog];
    });

    // Actual DB call
    await toggleHabitCompletion(habit.id, dateStr, habit.target_value, completed);
    // Silent reload to sync
    const freshLogs = await getHabitLogs();
    setLogs(freshLogs);
  };

  const handleUpdateValue = async (habit: Habit, dateStr: string, value: number) => {
    // Optimistic UI
    const isCompleted = value >= habit.target_value;
    const newLog = { habit_id: habit.id, date: dateStr, completed: isCompleted, value } as HabitLog;
    
    setLogs(prev => {
      const idx = prev.findIndex(l => l.habit_id === habit.id && l.date === dateStr);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], completed: isCompleted, value };
        return copy;
      }
      return [...prev, newLog];
    });

    await updateHabitValue(habit.id, dateStr, value, habit.target_value);
    const freshLogs = await getHabitLogs();
    setLogs(freshLogs);
  };

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground">
            Build positive routines and track your consistency.
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => {
            setEditingHabit(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Habit
        </Button>
      </div>

      <HabitStatsOverview 
        totalActive={globalStats.total}
        averageCompletionRate={globalStats.avgRate}
        bestStreakOverride={globalStats.bestOverall}
        currentStreakOverall={globalStats.currOverall}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl w-full" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
          <p className="text-lg font-medium text-foreground">No habits created yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Start small. Define your first habit.
          </p>
          <Button onClick={() => setDialogOpen(true)} variant="outline">Create a Habit</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              stats={habitStatsMap[habit.id] || { currentStreak: 0, longestStreak: 0, completionRate: 0, totalCompletions: 0 }}
              logs={logs.filter(l => l.habit_id === habit.id)}
              onToggle={handleToggle}
              onUpdateValue={handleUpdateValue}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShowHeatmap={setHeatmapHabit}
            />
          ))}
        </div>
      )}

      {/* Habit Create / Edit Form */}
      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        habit={editingHabit}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Monthly Heatmap Modal */}
      <Dialog open={!!heatmapHabit} onOpenChange={(open) => !open && setHeatmapHabit(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: heatmapHabit?.color }} />
              {heatmapHabit?.name} Performance
            </DialogTitle>
            <DialogDescription>
              {heatmapHabit?.notes && <span className="block italic mb-2">"{heatmapHabit.notes}"</span>}
              Monthly consistency heatmap.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            {heatmapHabit && (
              <HabitMonthlyHeatmap 
                habit={heatmapHabit} 
                logs={logs.filter(l => l.habit_id === heatmapHabit.id)} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

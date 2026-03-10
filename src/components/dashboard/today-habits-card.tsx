//today-habits-card.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Habit } from "@/lib/types/habit";
import { toggleHabitCompletion } from "@/lib/services/habit-service";
import { useToast } from "@/components/ui/use-toast";
import { Flame, Info } from "lucide-react";

interface TodayHabitsCardProps {
  initialHabits: (Habit & { isCompletedToday: boolean })[];
  onHabitChange: () => void;
}

export function TodayHabitsCard({ initialHabits, onHabitChange }: TodayHabitsCardProps) {
  const [habits, setHabits] = useState(initialHabits);
  const { toast } = useToast();

  const handleToggle = async (habitId: string, currentlyCompleted: boolean, targetValue: number) => {
    // Optimistic UI Update
    setHabits(prev => prev.map(h => 
      h.id === habitId ? { ...h, isCompletedToday: !currentlyCompleted } : h
    ));

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await toggleHabitCompletion(habitId, todayStr, targetValue, currentlyCompleted);
      onHabitChange(); // Tell parent dashboard to fetch new aggregated data
    } catch (err: any) {
      toast({ title: "Error tracking habit", description: err.message, variant: "destructive" });
      setHabits(initialHabits); // Revert on failure
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" /> Today's Habits
            </CardTitle>
            <CardDescription>Scheduled for today</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 flex-1 overflow-auto">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
            <Info className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No habits scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map(habit => (
              <div 
                key={habit.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/30 transition-all hover:shadow-sm"
              >
                <div className="flex flex-col">
                  <span className={`font-medium ${habit.isCompletedToday ? 'text-muted-foreground' : ''}`}>{habit.name}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{(habit as any).target_value} {(habit as any).unit}</span>
                </div>
                <div className="flex items-center gap-3">
                  {habit.isCompletedToday && (
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Done</span>
                  )}
                  <Switch 
                    checked={habit.isCompletedToday} 
                    onCheckedChange={() => handleToggle(habit.id, habit.isCompletedToday, (habit as any).target_value)} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

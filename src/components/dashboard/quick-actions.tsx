"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Flame, HeartPulse, Clock } from "lucide-react";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { HealthLogDialog } from "@/components/health/health-log-dialog";
import { useRouter } from "next/navigation";

export function QuickActions({ onActionComplete }: { onActionComplete: () => void }) {
  const [taskOpen, setTaskOpen] = useState(false);
  const [habitOpen, setHabitOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      
      {/* 1. Add Task */}
      <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)} className="gap-2 border-primary/20 hover:bg-primary/5 shadow-sm">
        <PlusCircle className="h-4 w-4 text-blue-500" />
        <span className="hidden sm:inline">Add Task</span>
        <span className="sm:hidden">Task</span>
      </Button>
      <TaskDialog 
        open={taskOpen} 
        onOpenChange={setTaskOpen} 
        onSave={() => {
          setTaskOpen(false);
          onActionComplete();
        }} 
      />

      {/* 2. Add Habit */}
      <Button variant="outline" size="sm" onClick={() => setHabitOpen(true)} className="gap-2 border-primary/20 hover:bg-primary/5 shadow-sm">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="hidden sm:inline">Add Habit</span>
        <span className="sm:hidden">Habit</span>
      </Button>
      <HabitDialog 
        open={habitOpen} 
        onOpenChange={setHabitOpen} 
        onSave={() => {
          setHabitOpen(false);
          onActionComplete();
        }} 
      />

      {/* 3. Log Health */}
      <Button variant="outline" size="sm" onClick={() => setHealthOpen(true)} className="gap-2 border-primary/20 hover:bg-primary/5 shadow-sm">
        <HeartPulse className="h-4 w-4 text-emerald-500" />
        <span className="hidden sm:inline">Log Health</span>
        <span className="sm:hidden">Health</span>
      </Button>
      <HealthLogDialog 
         open={healthOpen}
         onOpenChange={setHealthOpen}
         dateStr={new Date().toISOString().split('T')[0]} // Pre-fill today
         onSave={() => {
           setHealthOpen(false);
           onActionComplete();
         }}
      />

      {/* 4. Start Timer */}
      <Button variant="outline" size="sm" onClick={() => router.push('/time')} className="gap-2 border-primary/20 hover:bg-primary/5 shadow-sm">
        <Clock className="h-4 w-4 text-indigo-500" />
        <span className="hidden sm:inline">Timer</span>
        <span className="sm:hidden">Timer</span>
      </Button>

    </div>
  );
}

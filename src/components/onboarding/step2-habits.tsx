"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTED_HABITS = [
  "Read 10 pages",
  "Drink 8 glasses of water",
  "Morning Meditation",
  "No screens after 10 PM",
  "Exercise for 30 mins",
  "Journaling",
];

interface Props {
  selected: string[];
  onChange: (habits: string[]) => void;
}

export function Step2Habits({ selected, onChange }: Props) {
  const toggleHabit = (habit: string) => {
    if (selected.includes(habit)) {
      onChange(selected.filter(h => h !== habit));
    } else {
      onChange([...selected, habit]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pick some starter habits</h2>
        <p className="text-muted-foreground mt-2">
          Habits are the building blocks of your goals. Select a few to track daily.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTED_HABITS.map((habit) => {
          const isSelected = selected.includes(habit);
          return (
            <button
              key={habit}
              onClick={() => toggleHabit(habit)}
              className={cn(
                "relative flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              )}
            >
              <span className="font-medium">{habit}</span>
              {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

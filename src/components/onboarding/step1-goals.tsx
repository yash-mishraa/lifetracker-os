"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTED_GOALS = [
  "Get Fit & Healthy",
  "Learn a New Language",
  "Save Money",
  "Read More Books",
  "Build a Side Project",
  "Improve Mental Health",
];

interface Props {
  selected: string[];
  onChange: (goals: string[]) => void;
}

export function Step1Goals({ selected, onChange }: Props) {
  const toggleGoal = (goal: string) => {
    if (selected.includes(goal)) {
      onChange(selected.filter(g => g !== goal));
    } else {
      onChange([...selected, goal]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">What are your main goals?</h2>
        <p className="text-muted-foreground mt-2">
          Select a few areas you want to focus on. We will set these up in your Goals dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTED_GOALS.map((goal) => {
          const isSelected = selected.includes(goal);
          return (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={cn(
                "relative flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border hover:border-border/80 hover:bg-muted/50"
              )}
            >
              <span className="font-medium">{goal}</span>
              {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

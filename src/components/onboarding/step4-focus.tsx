"use client";

import { Target } from "lucide-react";

interface Props {
  hours: number;
  onChange: (hours: number) => void;
}

export function Step4Focus({ hours, onChange }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Set a daily focus target</h2>
        <p className="text-muted-foreground mt-2">
          Deep work accelerates your goals. Choose a realistic daily target for deep, uninterrupted work hours.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center space-y-6 pt-6">
        <Target className="h-16 w-16 text-primary opacity-80" />
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onChange(Math.max(1, hours - 1))}
            className="w-12 h-12 rounded-full border bg-card flex items-center justify-center text-xl font-bold hover:bg-muted transition"
          >
            -
          </button>
          
          <div className="text-center w-32">
            <span className="text-5xl font-black">{hours}</span>
            <span className="block text-sm font-medium text-muted-foreground tracking-widest uppercase mt-1">Hours</span>
          </div>

          <button 
            onClick={() => onChange(Math.min(8, hours + 1))}
            className="w-12 h-12 rounded-full border bg-card flex items-center justify-center text-xl font-bold hover:bg-muted transition"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

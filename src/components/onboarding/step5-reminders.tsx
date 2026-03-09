"use client";

import { BellRing, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function Step5Reminders({ enabled, onChange }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stay on track</h2>
        <p className="text-muted-foreground mt-2">
          Would you like to get reminders to log your habits and finish your daily tasks?
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          onClick={() => onChange(true)}
          className={cn(
            "flex-1 flex flex-col items-center gap-4 p-8 rounded-xl border transition-all text-center",
            enabled 
              ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" 
              : "border-border hover:border-border/80 hover:bg-muted/50"
          )}
        >
          <BellRing className={cn("h-10 w-10", enabled ? "text-primary" : "text-muted-foreground")} />
          <div>
            <span className="block font-semibold text-lg">Send Reminders</span>
            <span className="block text-sm text-muted-foreground mt-1">Keep me accountable daily.</span>
          </div>
        </button>

        <button
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 flex flex-col items-center gap-4 p-8 rounded-xl border transition-all text-center",
            !enabled 
              ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20" 
              : "border-border hover:border-border/80 hover:bg-muted/50"
          )}
        >
          <BellOff className={cn("h-10 w-10", !enabled ? "text-primary" : "text-muted-foreground")} />
          <div>
            <span className="block font-semibold text-lg">No Reminders</span>
            <span className="block text-sm text-muted-foreground mt-1">I'll remember on my own.</span>
          </div>
        </button>
      </div>
    </div>
  );
}

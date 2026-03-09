"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Moon, Target } from "lucide-react";

interface InsightsGridProps {
  mostProductiveDay: string;
  averageSleep: string;
  habitSuccessRate: string;
}

export function InsightsGrid({ mostProductiveDay, averageSleep, habitSuccessRate }: InsightsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
      
      <Card className="flex flex-col justify-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-md text-blue-600 dark:text-blue-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Most Productive Day</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{mostProductiveDay}</p>
          <p className="text-xs text-muted-foreground mt-1">Based on highest focus hours</p>
        </CardContent>
      </Card>

      <Card className="flex flex-col justify-center bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-md text-indigo-600 dark:text-indigo-400">
              <Moon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Average Sleep</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{averageSleep}</p>
          <p className="text-xs text-muted-foreground mt-1">Over this period</p>
        </CardContent>
      </Card>

      <Card className="flex flex-col justify-center bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-md text-amber-600 dark:text-amber-400">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground">Habit Success</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{habitSuccessRate}</p>
          <p className="text-xs text-muted-foreground mt-1">Completion rate vs target</p>
        </CardContent>
      </Card>

    </div>
  );
}

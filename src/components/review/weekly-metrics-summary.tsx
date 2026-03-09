"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WeeklyReviewMetrics } from "@/lib/types/review";
import { CheckCircle2, Flame, Moon, Clock } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface WeeklyMetricsSummaryProps {
  metrics: WeeklyReviewMetrics;
  dateInWeek: Date;
}

export function WeeklyMetricsSummary({ metrics, dateInWeek }: WeeklyMetricsSummaryProps) {
  const start = startOfWeek(dateInWeek, { weekStartsOn: 1 });
  const end = endOfWeek(dateInWeek, { weekStartsOn: 1 });
  const dateRange = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Weekly Metrics</CardTitle>
        <CardDescription>{dateRange}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="flex flex-col p-4 bg-background rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">Tasks Done</span>
          </div>
          <p className="text-3xl font-bold">{metrics.tasks_completed}</p>
        </div>

        <div className="flex flex-col p-4 bg-background rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-muted-foreground">Habits Hit</span>
          </div>
          <p className="text-3xl font-bold">{metrics.habits_completed}</p>
        </div>

        <div className="flex flex-col p-4 bg-background rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-muted-foreground">Avg Sleep</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold">{metrics.average_sleep}</p>
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">hrs/night</span>
          </div>
        </div>

        <div className="flex flex-col p-4 bg-background rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-muted-foreground">Focus Time</span>
          </div>
           <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold">{metrics.total_focus_hours}</p>
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">hrs</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

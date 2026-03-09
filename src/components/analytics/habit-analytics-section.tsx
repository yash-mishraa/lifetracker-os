"use client";

import { useEffect, useState } from "react";
import { getAdvancedHabitAnalytics } from "@/lib/services/habit-analytics-service";
import { HabitAnalyticsData } from "@/lib/types/habit-analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HabitInsightsCards } from "./habit-insights-cards";
import { HabitHeatmap } from "./habit-heatmap";
import { HabitConsistencyGraph } from "./habit-consistency-graph";
import { Activity } from "lucide-react";

export function HabitAnalyticsSection({ daysBack }: { daysBack: number }) {
  const [data, setData] = useState<HabitAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await getAdvancedHabitAnalytics(daysBack);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [daysBack]);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center border rounded-xl bg-muted/10">
        <Activity className="h-8 w-8 text-primary/30 animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-2xl font-bold tracking-tight">Habit Deep Dive</h2>
      </div>

      <HabitInsightsCards insights={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Activity Heatmap</CardTitle>
            <CardDescription>Daily completion density</CardDescription>
          </CardHeader>
          <CardContent>
            <HabitHeatmap data={data.heatmapData} />
            
            <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground font-medium">
               <span>Less</span>
               <div className="w-3 h-3 rounded-sm bg-muted/30"></div>
               <div className="w-3 h-3 rounded-sm bg-orange-500/40"></div>
               <div className="w-3 h-3 rounded-sm bg-emerald-500/60"></div>
               <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
               <span>More</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Consistency Trend</CardTitle>
            <CardDescription>Completion rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <HabitConsistencyGraph data={data.consistencyData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

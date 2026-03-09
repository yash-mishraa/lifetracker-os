import { HabitAnalyticsData } from "@/lib/types/habit-analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

export function HabitInsightsCards({ insights }: { insights: Omit<HabitAnalyticsData, 'heatmapData' | 'consistencyData'> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2 text-indigo-500 mb-2">
            <Target className="h-5 w-5" />
            <span className="font-semibold">Success Rate</span>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-4xl font-bold tracking-tighter">{insights.successRate}</span>
            <span className="text-xl text-muted-foreground pb-1">%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Of scheduled habits completed.</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Failure Pattern</span>
          </div>
          <p className="text-lg font-medium leading-tight mt-2 flex-1 flex items-center">
            "{insights.failurePattern}"
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">Streak Prediction</span>
          </div>
          <p className="text-lg font-medium leading-tight mt-2 flex-1 flex items-center">
            "{insights.streakPrediction}"
          </p>
        </CardContent>
      </Card>

    </div>
  );
}

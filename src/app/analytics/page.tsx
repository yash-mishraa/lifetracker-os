"use client";

import { useEffect, useState } from "react";
import { getAnalyticsData, AnalyticsData } from "@/lib/services/analytics-service";
import { ProductivityScoreCard } from "@/components/analytics/productivity-score-card";
import { InsightsGrid } from "@/components/analytics/insights-grid";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { HabitAnalyticsSection } from "@/components/analytics/habit-analytics-section";
import { LifeBalanceSection } from "@/components/analytics/life-balance-section";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState("7");
  const { toast } = useToast();

  useEffect(() => {
    loadData(Number(daysBack));
  }, [daysBack]);

  async function loadData(days: number) {
    setLoading(true);
    try {
      const result = await getAnalyticsData(days);
      setData(result);
    } catch (err: any) {
      toast({ title: "Error loading analytics", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Aggregated insights from all your tracking modules.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={daysBack} onValueChange={setDaysBack}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => loadData(Number(daysBack))} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-[400px] flex items-center justify-center border rounded-xl bg-muted/10">
          <p className="text-muted-foreground animate-pulse">Calculating productivity score...</p>
        </div>
      ) : data ? (
        <div className="space-y-6 lg:space-y-8">
          
          {/* Top Row: Score & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <ProductivityScoreCard score={data.score} breakdown={data.scoreBreakdown} />
            </div>
            <div className="lg:col-span-3">
              <InsightsGrid {...data.insights} />
            </div>
          </div>

          {/* Bottom Row: Charts */}
          <div className="grid grid-cols-1 gap-6">
            <AnalyticsCharts data={data.charts} />
          </div>

          <div className="pt-8 mb-4 border-t">
            <HabitAnalyticsSection daysBack={Number(daysBack)} />
          </div>

          <div className="pt-8 mb-4 border-t">
            <LifeBalanceSection />
          </div>
          
        </div>
      ) : null}
    </div>
  );
}

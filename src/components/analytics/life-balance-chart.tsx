"use client";

import { useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LifeBalanceData } from "@/lib/types/life-balance";

interface LifeBalanceChartProps {
  data: LifeBalanceData | null;
  isLoading?: boolean;
}

export function LifeBalanceChart({ data, isLoading }: LifeBalanceChartProps) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.scores;
  }, [data]);

  if (isLoading) {
    return (
      <Card className="w-full border-muted/50 shadow-sm bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Life Balance</CardTitle>
          <CardDescription>Loading radar data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <Card className="w-full border-muted/50 shadow-sm bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Life Balance</CardTitle>
          <CardDescription>No data available to calculate balance.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
          Track tasks, habits, and health to see your balance.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-card/60 backdrop-blur-xl pb-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Life Balance</CardTitle>
            <CardDescription className="text-sm mt-1">
              Based on your habits, tasks, goals, & health.
            </CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-4xl font-heading font-bold tracking-tight text-emerald-500">
              {data.overallBalanceScore}
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Overall Score
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full mt-4 bg-background/30 rounded-xl border p-4 text-muted-foreground">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
              <PolarAngleAxis 
                dataKey="area" 
                tick={{ fill: "currentColor", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }} 
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={false} 
                axisLine={false} 
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg flex flex-col gap-1 min-w-[120px]">
                        <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{data.area}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl text-emerald-500 font-bold">
                            {data.score}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground mt-1">/ 100</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={3}
                fill="#10b981"
                fillOpacity={0.5}
                activeDot={{ r: 6, fill: "#10b981", stroke: "hsl(var(--background))", strokeWidth: 2 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

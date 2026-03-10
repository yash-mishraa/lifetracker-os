"use client";

import { useMemo } from "react";
import { HealthLog } from "@/lib/types/health";
import { format, parseISO, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HealthChartsProps {
  logs: HealthLog[];
  days?: number; // How many days back to show by default (e.g., 14, 30)
}

export function HealthCharts({ logs, days = 14 }: HealthChartsProps) {
  // Memoize the chart data derivation
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];
    
    // Create an array for the last `days` days, filling missing days with nulls/zeroes
    const end = new Date();
    const map = new Map<string, HealthLog>();
    logs.forEach(l => map.set(l.date, l));

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(end, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const log = map.get(dateStr);
      
      result.push({
        dateStr,
        displayDate: format(d, "MMM d"),
sleep: log?.sleep_hours != null ? Number(log.sleep_hours) : null,
water: log?.water_intake ? Number(log.water_intake) : 0,
weight: log?.weight != null ? Number(log.weight) : null,
steps: log?.steps ? Number(log.steps) : 0,
calories: log?.calories ? Number(log.calories) : 0,
        hasLog: !!log
      });
    }
    return result;
  }, [logs, days]);

  if (logs.length === 0) {
    return (
      <div className="text-center py-20 border-2 border-dashed rounded-xl border-muted">
        <p className="text-muted-foreground">Not enough data to show trends.</p>
        <p className="text-xs text-muted-foreground/60 mt-2">Log some health data first to see your charts.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-sm">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Tabs defaultValue="sleep" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Trend Analysis</h3>
          <p className="text-sm text-muted-foreground">Last {days} days</p>
        </div>
        <TabsList className="grid w-full sm:w-auto grid-cols-4 h-9">
          <TabsTrigger value="sleep" className="text-xs">Sleep</TabsTrigger>
          <TabsTrigger value="weight" className="text-xs">Weight</TabsTrigger>
          <TabsTrigger value="water" className="text-xs">Water</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
        </TabsList>
      </div>

      {/* Sleep Trend */}
      <TabsContent value="sleep" className="space-y-4 outline-none">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-indigo-500">Sleep Duration</CardTitle>
            <CardDescription>Hours of sleep per night</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.2} />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
  type="monotone" 
  dataKey="sleep" 
  name="Sleep (hrs)" 
  stroke="#6366f1" 
  strokeWidth={2}
  fillOpacity={1} 
  fill="url(#colorSleep)" 
  connectNulls
  dot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "white" }}
  activeDot={{ r: 7 }}
/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Weight Trend */}
      <TabsContent value="weight" className="space-y-4 outline-none">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-rose-500">Weight Tracker</CardTitle>
            <CardDescription>Body weight progression</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.2} />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    name="Weight" 
                    stroke="#f43f5e" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "white" }}
                    activeDot={{ r: 6 }}
                    connectNulls 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Water Intake */}
      <TabsContent value="water" className="space-y-4 outline-none">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-500">Hydration</CardTitle>
            <CardDescription>Daily water intake</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.2} />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#888', opacity: 0.1 }} content={<CustomTooltip />} />
                  <Bar dataKey="water" name="Water" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Activity (Steps & Calories) */}
      <TabsContent value="activity" className="space-y-4 outline-none">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-500">Daily Steps</CardTitle>
            <CardDescription>Step count progression</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" strokeOpacity={0.2} />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#888', opacity: 0.1 }} content={<CustomTooltip />} />
                  <Bar dataKey="steps" name="Steps" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

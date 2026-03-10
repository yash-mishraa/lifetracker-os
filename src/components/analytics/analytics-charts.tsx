"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AnalyticsData } from "@/lib/services/analytics-service";

interface AnalyticsChartsProps {
  data: AnalyticsData['charts'];
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2">
    <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center">
      <svg className="h-5 w-5 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
    <p className="text-sm text-muted-foreground/70 font-medium">{message}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm px-4 py-3 shadow-xl shadow-black/20">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-sm font-semibold text-foreground">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
          <span className="text-xs text-muted-foreground">{entry.name}</span>
        </div>
      ))}
    </div>
  );
};

const axisStyle = {
  fontSize: 11,
  fontWeight: 500,
  fill: 'hsl(var(--muted-foreground))',
};

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <Card className="col-span-1 lg:col-span-3 border-border/40 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Activity Trends</CardTitle>
        <CardDescription className="text-xs">Visualize your performance over the selected period</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-6 h-8 bg-muted/50 p-0.5 gap-0.5">
            <TabsTrigger value="tasks" className="h-7 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Tasks</TabsTrigger>
            <TabsTrigger value="focus" className="h-7 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Focus Time</TabsTrigger>
            <TabsTrigger value="health" className="h-7 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Health</TabsTrigger>
            <TabsTrigger value="goals" className="h-7 text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">Active Goals</TabsTrigger>
          </TabsList>

          {/* TASKS TAB */}
          <TabsContent value="tasks">
            <div className="h-[280px] w-full">
              {data.tasksCompletedByDay.every(d => d.count === 0) ? (
                <EmptyState message="No task completions in this period" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tasksCompletedByDay} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barCategoryGap="40%">
                    <defs>
                      <linearGradient id="barTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} dy={8} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4, radius: 4 }} />
                    <Bar dataKey="count" name="Tasks" fill="url(#barTasks)" radius={[5, 5, 2, 2]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          {/* FOCUS TAB */}
          <TabsContent value="focus">
            <div className="h-[280px] w-full">
              {data.focusTimeByDay.every(d => d.hours === 0) ? (
                <EmptyState message="No focus sessions in this period" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.focusTimeByDay} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaFocus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} dy={8} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip formatter={(v: number) => `${v}h`} />} />
                    <Area type="monotone" dataKey="hours" name="Hours" stroke="#3b82f6" strokeWidth={2} fill="url(#areaFocus)" dot={false} activeDot={{ r: 5, fill: "#3b82f6", stroke: "hsl(var(--background))", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          {/* HEALTH TAB */}
          <TabsContent value="health">
            <div className="h-[280px] w-full">
              {data.waterIntakeByDay.every(d => d.amount === 0) ? (
                <EmptyState message="No health data in this period" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.waterIntakeByDay} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={axisStyle} tickLine={false} axisLine={false} dy={8} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip formatter={(v: number) => `${v}L`} />} />
                    <Line
                      type="monotone" dataKey="amount" name="Water"
                      stroke="#10b981" strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#10b981", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#10b981", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          {/* GOALS TAB */}
          <TabsContent value="goals">
            <div className="h-[280px] w-full">
              {data.activeGoalsProgress.length === 0 ? (
                <EmptyState message="No active goals with milestones" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={data.activeGoalsProgress} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGoals" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis type="number" domain={[0, 100]} tick={axisStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="title" tick={{ ...axisStyle, fill: 'hsl(var(--foreground))' }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip content={<CustomTooltip formatter={(v: number) => `${v}%`} />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                    <Bar dataKey="progress" name="Progress" fill="url(#barGoals)" radius={[2, 5, 5, 2]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
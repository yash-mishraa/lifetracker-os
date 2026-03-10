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

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <Card className="col-span-1 lg:col-span-3 border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader>
        <CardTitle>Activity Trends</CardTitle>
        <CardDescription>Visualize your performance over the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="focus">Focus Time</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="goals">Active Goals</TabsTrigger>
          </TabsList>

          {/* TASKS TAB */}
          <TabsContent value="tasks">
  <div className="h-[300px] w-full">
             {data.tasksCompletedByDay.every(d => d.count === 0) ? (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No task completions in this period
      </div>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tasksCompletedByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                  />
                  <Bar dataKey="count" name="Tasks Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          </TabsContent>

          {/* FOCUS TAB */}
          <TabsContent value="focus">
  <div className="h-[300px] w-full">
    {data.focusTimeByDay.every(d => d.hours === 0) ? (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No focus sessions in this period
      </div>
    ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.focusTimeByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }} />
                  <Area type="monotone" dataKey="hours" name="Focus Hours" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFocus)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          </TabsContent>

          {/* HEALTH (WATER) TAB */}
          <TabsContent value="health">
  <div className="h-[300px] w-full">
    {data.waterIntakeByDay.every(d => d.amount === 0) ? (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No health data in this period
      </div>
    ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.waterIntakeByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }} />
                  <Line type="monotone" dataKey="amount" name="Water (L)" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          </TabsContent>

          {/* GOALS TAB */}
          <TabsContent value="goals">
  <div className="h-[300px] w-full">
    {data.activeGoalsProgress.length === 0 ? (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No active goals with milestones
      </div>
    ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data.activeGoalsProgress} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                    formatter={(value: any) => [`${value}%`, 'Progress']}
                  />
                  <Bar dataKey="progress" name="Progress (%)" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
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

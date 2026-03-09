"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProjectTimeStats } from "@/lib/types/time";
import { Clock, Calendar, BarChart3 } from "lucide-react";

interface TimeDashboardStatsProps {
  todaySeconds: number;
  weekSeconds: number;
  projectStats: ProjectTimeStats[];
}

export function TimeDashboardStats({ todaySeconds, weekSeconds, projectStats }: TimeDashboardStatsProps) {
  const formatHours = (secs: number) => {
    return (secs / 3600).toFixed(1);
  };

  const todayHours = formatHours(todaySeconds);
  const weekHours = formatHours(weekSeconds);

  // Calculate percentages for project bars
  const totalProjectSecs = projectStats.reduce((sum, p) => sum + p.total_seconds, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Today Stat */}
      <Card>
        <CardContent className="pt-6 pb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Focus Today</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{todayHours}</span>
              <span className="text-muted-foreground font-medium">hrs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Stat */}
      <Card>
        <CardContent className="pt-6 pb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Focus This Week</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{weekHours}</span>
              <span className="text-muted-foreground font-medium">hrs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Breakdown */}
      <Card className="md:col-span-1 border-dashed">
        <CardHeader className="pb-2 pt-5">
           <CardTitle className="text-base flex items-center gap-2">
             <BarChart3 className="h-4 w-4 text-muted-foreground" />
             Time per Project
           </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {projectStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No time logged yet.</p>
          ) : (
            <div className="space-y-3">
              {projectStats.slice(0, 3).map(stat => {
                const percent = totalProjectSecs > 0 ? (stat.total_seconds / totalProjectSecs) * 100 : 0;
                return (
                  <div key={stat.project_id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate max-w-[120px]">{stat.project_name}</span>
                      <span className="text-muted-foreground">{formatHours(stat.total_seconds)}h ({Math.round(percent)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {projectStats.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  + {projectStats.length - 3} more projects
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

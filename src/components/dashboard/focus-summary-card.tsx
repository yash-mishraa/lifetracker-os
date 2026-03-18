import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface FocusSummaryCardProps {
  focusSeconds: number;
  completedBlockMinutes?: number;
  totalPlannedMinutes?: number;
  completedTasksCount?: number;
  totalTasksCount?: number;
}

export function FocusSummaryCard({
  focusSeconds,
  completedBlockMinutes = 0,
  totalPlannedMinutes = 0,
  completedTasksCount = 0,
  totalTasksCount = 0,
}: FocusSummaryCardProps) {
  function fmt(mins: number) {
    if (mins === 0) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  }

  // Use planned minutes as the goal (or 480 min / 8h as fallback)
  const goalMins = totalPlannedMinutes > 0 ? totalPlannedMinutes : 480;
  const progressPct = Math.min((completedBlockMinutes / goalMins) * 100, 100);
  const taskPct = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  return (
    <Card className="h-full bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-indigo-500" /> Work Done Today
        </CardTitle>
        <CardDescription>
          {totalPlannedMinutes > 0
            ? `${fmt(completedBlockMinutes)} of ${fmt(totalPlannedMinutes)} planned`
            : "Completed blocks + tasks"}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-indigo-500">
            {fmt(completedBlockMinutes)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            / {fmt(goalMins)}
          </span>
        </div>

        <div className="space-y-1.5">
          <Progress value={progressPct} className="h-3 bg-indigo-500/20 [&>div]:bg-indigo-500" />
          <p className="text-xs text-right text-muted-foreground font-medium">{Math.round(progressPct)}%</p>
        </div>

        {totalTasksCount > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Tasks</span>
              <span>{completedTasksCount} / {totalTasksCount}</span>
            </div>
            <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${taskPct}%` }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
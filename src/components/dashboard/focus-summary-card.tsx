import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface FocusSummaryCardProps {
  focusSeconds: number;
  /** Total minutes from completed planner blocks + unlinked completed tasks */
  completedBlockMinutes?: number;
  completedTasksCount?: number;
  totalTasksCount?: number;
}

export function FocusSummaryCard({
  focusSeconds,
  completedBlockMinutes = 0,
  completedTasksCount = 0,
  totalTasksCount = 0,
}: FocusSummaryCardProps) {
  // Use whichever is higher: block-based or timer-based
  const timerMins = Math.floor(focusSeconds / 60);
  const totalMins = Math.max(completedBlockMinutes, timerMins);

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  const GOAL_MINS = 480; // 8h
  const progressPct = Math.min((totalMins / GOAL_MINS) * 100, 100);

  const displayTime = totalMins === 0
    ? "0m"
    : hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;

  const taskPct = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  return (
    <Card className="h-full bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-indigo-500" /> Work Done Today
        </CardTitle>
        <CardDescription>
          Completed blocks + tasks · 8h goal
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-indigo-500">{displayTime}</span>
          <span className="text-sm font-medium text-muted-foreground">/ 8h goal</span>
        </div>

        {/* Block time progress */}
        <div className="space-y-1.5">
          <Progress value={progressPct} className="h-3 bg-indigo-500/20 [&>div]:bg-indigo-500" />
          <p className="text-xs text-right text-muted-foreground font-medium">{Math.round(progressPct)}%</p>
        </div>

        {/* Task completion bar */}
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
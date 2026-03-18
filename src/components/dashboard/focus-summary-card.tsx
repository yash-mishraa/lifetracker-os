import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface FocusSummaryCardProps {
  focusSeconds: number;
  /** Completed planner blocks for today — passed from dashboard */
  completedBlocks?: { startTime: string; endTime: string }[];
  /** Completed tasks today count */
  completedTasksCount?: number;
  /** Total tasks today count */
  totalTasksCount?: number;
}

function parseTimeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function FocusSummaryCard({
  focusSeconds,
  completedBlocks = [],
  completedTasksCount = 0,
  totalTasksCount = 0,
}: FocusSummaryCardProps) {
  // Total work time from completed planner blocks
  const blockMins = completedBlocks.reduce((sum, b) => {
    const diff = parseTimeToMins(b.endTime) - parseTimeToMins(b.startTime);
    return sum + Math.max(0, diff);
  }, 0);

  // Also count time from completed tasks (estimated_minutes) as fallback
  // We use whichever is higher: block-based or timer-based
  const timerMins = Math.floor(focusSeconds / 60);
  const totalMins = Math.max(blockMins, timerMins);

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  // Goal: 8 hours of planned work
  const GOAL_MINS = 480;
  const progressPct = Math.min((totalMins / GOAL_MINS) * 100, 100);

  const displayTime = totalMins === 0
    ? "0m"
    : hours > 0
    ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    : `${mins}m`;

  return (
    <Card className="h-full bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-indigo-500" /> Work Done Today
        </CardTitle>
        <CardDescription>
          {totalTasksCount > 0
            ? `${completedTasksCount} of ${totalTasksCount} tasks completed`
            : "Time from completed schedule blocks"}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-indigo-500">
              {displayTime}
            </span>
            <span className="text-sm font-medium text-muted-foreground">/ 8h goal</span>
          </div>

          {totalTasksCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 bg-muted/40 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0}%` }}
                />
              </div>
              <span>{completedTasksCount}/{totalTasksCount} tasks</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Progress value={progressPct} className="h-3 bg-indigo-500/20 [&>div]:bg-indigo-500" />
            <p className="text-xs text-right text-muted-foreground font-medium">{Math.round(progressPct)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
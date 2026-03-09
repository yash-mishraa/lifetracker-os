import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface FocusSummaryCardProps {
  focusSeconds: number;
}

export function FocusSummaryCard({ focusSeconds }: FocusSummaryCardProps) {
  // Goal: 2 hours (7200 seconds)
  const GOAL_SECONDS = 7200;
  
  const hours = Math.floor(focusSeconds / 3600);
  const minutes = Math.floor((focusSeconds % 3600) / 60);

  const goalHours = Math.floor(GOAL_SECONDS / 3600);
  const goalMinutes = Math.floor((GOAL_SECONDS % 3600) / 60);

  const progressPct = Math.min((focusSeconds / GOAL_SECONDS) * 100, 100);

  return (
    <Card className="h-full bg-gradient-to-br from-indigo-500/5 to-transparent border-indigo-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" /> Focus Target
        </CardTitle>
        <CardDescription>Daily deep work session</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="flex flex-col gap-4">
          
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-indigo-500">
              {hours > 0 ? `${hours}h ` : ''}{hours === 0 && minutes === 0 ? '0m' : `${minutes}m`}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              / {goalHours}h {goalMinutes > 0 ? `${goalMinutes}m` : ''} Goal
            </span>
          </div>

          <div className="space-y-1.5">
            <Progress value={progressPct} className="h-3 bg-indigo-500/20 [&>div]:bg-indigo-500" />
            <p className="text-xs text-right text-muted-foreground font-medium">{Math.round(progressPct)}%</p>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

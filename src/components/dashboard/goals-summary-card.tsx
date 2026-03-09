import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GoalWithMilestones } from "@/lib/types/goal";
import { Target, Trophy } from "lucide-react";

interface GoalsSummaryCardProps {
  activeGoals: { goal: GoalWithMilestones; progress: number }[];
}

export function GoalsSummaryCard({ activeGoals }: GoalsSummaryCardProps) {
  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/20">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
             <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Active Goals
             </CardTitle>
             <CardDescription>Top priorities in progress</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 flex-1 overflow-auto">
         {activeGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground text-center">
            <Target className="h-6 w-6 mb-2 opacity-20" />
            <p className="text-sm">No active goals with milestones.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map(({ goal, progress }) => (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium leading-none line-clamp-1 flex-1 pr-2">{goal.title}</span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-yellow-500/10 [&>div]:bg-yellow-500" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

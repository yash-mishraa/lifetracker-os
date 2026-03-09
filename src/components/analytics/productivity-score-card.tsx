"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, TrendingUp, Clock, Activity } from "lucide-react";

interface ProductivityScoreCardProps {
  score: number;
  breakdown: {
    tasks: number;
    habits: number;
    focus: number;
    health: number;
  };
}

export function ProductivityScoreCard({ score, breakdown }: ProductivityScoreCardProps) {
  // Determine color based on score
  let scoreColor = "text-red-500";
  let progressColor = "[&>div]:bg-red-500";
  let greeting = "Needs Focus";

  if (score >= 80) {
    scoreColor = "text-emerald-500";
    progressColor = "[&>div]:bg-emerald-500";
    greeting = "Outstanding!";
  } else if (score >= 50) {
    scoreColor = "text-amber-500";
    progressColor = "[&>div]:bg-amber-500";
    greeting = "On Track";
  }

  return (
    <Card className="h-full flex flex-col justify-between overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10" />
      
      <CardHeader className="pb-2">
        <CardTitle>Productivity Score</CardTitle>
        <CardDescription>Your overall performance rating</CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center py-6 flex-1">
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-muted/30"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - score / 100)}
              className={`${scoreColor} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold tracking-tighter ${scoreColor}`}>{score}</span>
            <span className="text-sm font-medium text-muted-foreground mt-1">{greeting}</span>
          </div>
        </div>

        <div className="w-full space-y-3 mt-2">
          <div className="text-sm font-medium text-muted-foreground mb-2 px-1">Score Breakdown</div>
          
          <div className="space-y-2.5 px-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span>Task Completion</span>
              </div>
              <span className="font-medium">+{breakdown.tasks} pts</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <span>Habit Consistency</span>
              </div>
              <span className="font-medium">+{breakdown.habits} pts</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Focus Hours</span>
              </div>
              <span className="font-medium">+{breakdown.focus} pts</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span>Health Logging</span>
              </div>
              <span className="font-medium">+{breakdown.health} pts</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

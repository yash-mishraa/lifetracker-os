"use client";

import { Card, CardContent } from "@/components/ui/card";
import { GoalWithMilestones } from "@/lib/types/goal";
import { Target, Flag, Rocket, CheckCircle2 } from "lucide-react";

interface GoalsOverviewProps {
  goals: GoalWithMilestones[];
}

export function GoalsOverview({ goals }: GoalsOverviewProps) {
  // Compute Stats
  const totalGoals = goals.length;
  
  // Count how many milestones exist overall and how many are completed
  let totalMilestones = 0;
  let completedMilestones = 0;
  
  let fullyCompletedGoals = 0;

  goals.forEach(goal => {
    totalMilestones += goal.milestones.length;
    
    let goalCompletedMs = 0;
    goal.milestones.forEach(m => {
      if (m.is_completed) {
        completedMilestones++;
        goalCompletedMs++;
      }
    });
    
    if (goal.milestones.length > 0 && goalCompletedMs === goal.milestones.length) {
      fullyCompletedGoals++;
    }
  });

  const overallProgress = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  const stats = [
    {
      label: "Total Goals",
      value: totalGoals.toString(),
      icon: Target,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Goals Reached",
      value: fullyCompletedGoals.toString(),
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Active Milestones",
      value: (totalMilestones - completedMilestones).toString(),
      icon: Flag,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Overall Progress",
      value: `${overallProgress}%`,
      icon: Rocket,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6 pb-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} mb-4`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { DisciplineHistory } from "@/lib/types/discipline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, CheckSquare, Flame, Heart, Activity } from "lucide-react";
import { DisciplineChart } from "./discipline-chart";

interface DisciplineScoreCardProps {
  data: DisciplineHistory;
}

export function DisciplineScoreCard({ data }: DisciplineScoreCardProps) {
  const { today, weeklyAverage, monthlyAverage, history } = data;

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Elite': return 'text-emerald-500';
      case 'Disciplined': return 'text-violet-500';
      case 'Improving': return 'text-amber-500';
      default: return 'text-rose-500';
    }
  };

  const getLabelBg = (label: string) => {
    switch (label) {
      case 'Elite': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'Disciplined': return 'bg-violet-500/10 border-violet-500/20';
      case 'Improving': return 'bg-amber-500/10 border-amber-500/20';
      default: return 'bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <Card className={`overflow-hidden h-full flex flex-col border backdrop-blur-2xl shadow-xl ${getLabelBg(today.label)} transition-colors duration-500`}>
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            Discipline Score
          </CardTitle>
          <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLabelColor(today.label)} ${getLabelBg(today.label)}`}>
            {today.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pb-6">
        {/* Main Score Display */}
        <div className="flex items-end gap-2 mb-6 relative z-10">
          <span className={`text-7xl font-heading font-black tracking-tighter leading-none drop-shadow-sm ${getLabelColor(today.label)}`}>
            {today.totalScore}
          </span>
          <span className="text-muted-foreground font-medium mb-1 border-b-2 border-transparent text-lg">
            / 100
          </span>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4 mb-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-muted-foreground">
                <CheckSquare className="h-3.5 w-3.5 mr-1.5 opacity-70" /> Tasks (40%)
              </span>
              <span className="font-medium">{today.taskScore} / 40</span>
            </div>
            <Progress value={(today.taskScore / 40) * 100} className="h-1.5" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-muted-foreground">
                <Flame className="h-3.5 w-3.5 mr-1.5 opacity-70" /> Habits (30%)
              </span>
              <span className="font-medium">{today.habitScore} / 30</span>
            </div>
            <Progress value={(today.habitScore / 30) * 100} className="h-1.5" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-muted-foreground">
                <Target className="h-3.5 w-3.5 mr-1.5 opacity-70" /> Focus (20%)
              </span>
              <span className="font-medium">{today.focusScore} / 20</span>
            </div>
            <Progress value={(today.focusScore / 20) * 100} className="h-1.5" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center text-muted-foreground">
                <Heart className="h-3.5 w-3.5 mr-1.5 opacity-70" /> Health (10%)
              </span>
              <span className="font-medium">{today.healthScore} / 10</span>
            </div>
            <Progress value={(today.healthScore / 10) * 100} className="h-1.5" />
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
          <div>
             <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">7-Day Avg</p>
             <p className="text-xl font-bold">{weeklyAverage}</p>
          </div>
          <div>
             <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">30-Day Avg</p>
             <p className="text-xl font-bold">{monthlyAverage}</p>
          </div>
        </div>
        
        {/* Trend Chart */}
        <div className="mt-4 -mb-2">
           <DisciplineChart history={history} />
        </div>
      </CardContent>
    </Card>
  );
}

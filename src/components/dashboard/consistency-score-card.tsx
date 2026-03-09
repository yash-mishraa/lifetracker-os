import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface ConsistencyScoreCardProps {
  score: number; // 0-100
}

export function ConsistencyScoreCard({ score }: ConsistencyScoreCardProps) {
  let feedback = "Just starting out!";
  let ringColor = "text-muted-foreground";
  
  if (score >= 90) {
    feedback = "Unstoppable! 🔥";
    ringColor = "text-purple-500";
  } else if (score >= 70) {
    feedback = "Great consistency! 💪";
    ringColor = "text-blue-500";
  } else if (score >= 40) {
    feedback = "Building momentum 📈";
    ringColor = "text-amber-500";
  } else if (score > 0) {
    feedback = "Keep pushing forward! 🚀";
    ringColor = "text-slate-500";
  }

  return (
    <Card className={`h-full bg-gradient-to-br from-${ringColor.replace('text-', '')}/5 to-transparent border-${ringColor.replace('text-', '')}/20 overflow-hidden`}>
      <CardContent className="p-6 flex items-center justify-between h-full">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Activity className={`h-5 w-5 ${ringColor}`} />
            <span className="font-medium text-sm text-muted-foreground uppercase tracking-widest">Consistency</span>
          </div>
          <div className="text-4xl font-black tracking-tighter">
            {score}<span className="text-xl text-muted-foreground ml-1">%</span>
          </div>
          <p className="text-sm font-medium text-muted-foreground">{feedback}</p>
          <p className="text-xs text-muted-foreground/60">Trailing 30 Days</p>
        </div>

        {/* Circular Progress (Doughnut) */}
        <div className="relative flex items-center justify-center shrink-0 ml-4">
          <svg className="w-24 h-24 transform -rotate-90">
             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/10" />
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - (isNaN(score) ? 0 : score) / 100)}
              className={`${ringColor} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

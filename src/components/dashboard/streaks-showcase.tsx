import { Card, CardContent } from "@/components/ui/card";
import { Flame, Clock, CheckCircle2 } from "lucide-react";

interface StreaksShowcaseProps {
  habits: number;
  productivity: number;
  focus: number;
}

export function StreaksShowcase({ habits, productivity, focus }: StreaksShowcaseProps) {
  return (
    <Card className="h-full bg-card/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -z-10" />
      <CardContent className="p-6 grid grid-cols-3 gap-4 h-full">
        
        <div className="flex flex-col items-center text-center justify-center space-y-2">
           <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
             <Flame className="h-5 w-5 text-orange-500" />
           </div>
           <div>
             <div className="text-2xl font-bold">{habits}</div>
             <div className="text-xs text-muted-foreground font-medium uppercase mt-1">Habit Days</div>
           </div>
        </div>

        <div className="flex flex-col items-center text-center justify-center space-y-2 border-x border-border/40 px-2 lg:px-4">
           <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
             <CheckCircle2 className="h-5 w-5 text-blue-500" />
           </div>
           <div>
             <div className="text-2xl font-bold">{productivity}</div>
             <div className="text-xs text-muted-foreground font-medium uppercase mt-1">Active Days</div>
           </div>
        </div>

        <div className="flex flex-col items-center text-center justify-center space-y-2">
           <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
             <Clock className="h-5 w-5 text-indigo-500" />
           </div>
           <div>
             <div className="text-2xl font-bold">{focus}</div>
             <div className="text-xs text-muted-foreground font-medium uppercase mt-1">Focus Days</div>
           </div>
        </div>

      </CardContent>
    </Card>
  );
}

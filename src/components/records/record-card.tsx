import { Trophy, Flame, CheckCircle, Target, Award, Clock } from "lucide-react";
import { PersonalRecord } from "@/lib/types/records";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  longest_habit_streak: <Flame className="h-6 w-6 text-orange-500" />,
  most_focus_hours: <Clock className="h-6 w-6 text-blue-500" />,
  most_tasks_completed: <CheckCircle className="h-6 w-6 text-emerald-500" />,
  best_discipline_score: <Target className="h-6 w-6 text-purple-500" />,
};

const gradientMap: Record<string, string> = {
  longest_habit_streak: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
  most_focus_hours: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  most_tasks_completed: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  best_discipline_score: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
};

interface RecordCardProps {
  record: PersonalRecord;
  className?: string;
}

export function RecordCard({ record, className }: RecordCardProps) {
  const icon = iconMap[record.id] || <Award className="h-6 w-6 text-amber-500" />;
  const gradient = gradientMap[record.id] || "from-amber-500/10 to-amber-500/5 border-amber-500/20";
  
  const formattedDate = record.date_achieved 
    ? format(parseISO(record.date_achieved), "MMM d, yyyy")
    : "Not yet achieved";

  return (
    <Card className={cn("relative overflow-hidden border bg-gradient-to-br transition-all hover:shadow-md", gradient, className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="bg-background/80 p-3 rounded-xl shadow-sm border backdrop-blur-sm">
            {icon}
          </div>
          {record.date_achieved && (
            <div className="text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded-full backdrop-blur-sm">
              {formattedDate}
            </div>
          )}
        </div>
        
        <div className="mt-4 space-y-1">
          <h3 className="font-semibold text-lg">{record.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {record.description}
          </p>
          {record.related_item_name && (
            <p className="text-xs font-medium text-primary mt-1">
              {record.related_item_name}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight">
            {record.value === 0 && !record.date_achieved ? "-" : record.value}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {record.unit}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

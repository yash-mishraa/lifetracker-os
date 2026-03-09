import { DailyCompletion } from "@/lib/types/habit-analytics";
import { format, parseISO } from "date-fns";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function HabitHeatmap({ data }: { data: DailyCompletion[] }) {
  if (!data || data.length === 0) return null;

  // Split into weeks for the grid
  const weeks: DailyCompletion[][] = [];
  let currentWeek: DailyCompletion[] = [];
  
  data.forEach(day => {
     if (currentWeek.length === 7) {
       weeks.push(currentWeek);
       currentWeek = [];
     }
     currentWeek.push(day);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getColorClass = (rate: number, scheduled: number) => {
    if (scheduled === 0) return "bg-muted/30"; // No habits scheduled
    if (rate === 0) return "bg-rose-500/20"; // Failed everything
    if (rate < 40) return "bg-orange-500/40"; 
    if (rate < 80) return "bg-emerald-500/60";
    return "bg-emerald-500"; // 80-100%
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-1.5 min-w-max">
        <TooltipProvider delay={100}>
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day, dIdx) => (
                <Tooltip key={`${wIdx}-${dIdx}`}>
                  <TooltipTrigger
                    className={`w-4 h-4 rounded-sm ${getColorClass(day.completionRate, day.totalScheduled)} transition-colors hover:ring-2 hover:ring-primary/50 cursor-pointer border-none`}
                  />
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-semibold mb-1">{format(parseISO(day.date), 'MMM d, yyyy')}</p>
                      {day.totalScheduled === 0 ? (
                        <p className="text-xs text-muted-foreground">No habits scheduled</p>
                      ) : (
                        <p className="text-xs">{day.totalCompleted} / {day.totalScheduled} completed ({day.completionRate}%)</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getTodaySchedule } from "@/lib/services/planner-service";
import { getTasks } from "@/lib/services/task-service";
import { TimeBlock } from "@/lib/types/planner";
import { Task, PRIORITY_CONFIG } from "@/lib/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isToday, isPast } from "date-fns";

export function TodaysPlan() {
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "tasks">("schedule");

  useEffect(() => {
    async function load() {
      try {
        const [blocks, allTasks] = await Promise.all([
          getTodaySchedule(),
          getTasks(),
        ]);
        setSchedule(blocks.slice(0, 5));
        // Today's + overdue tasks, not completed
        const relevant = allTasks
          .filter(t => t.status !== "completed" && (
            !t.deadline ||
            isToday(new Date(t.deadline)) ||
            isPast(new Date(t.deadline))
          ))
          .slice(0, 5);
        setTasks(relevant);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card className="flex flex-col h-full bg-gradient-to-b from-card to-card/50">
      <CardHeader className="border-b pb-3 px-5 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          Today
        </CardTitle>
        <Link href="/plan" className="hidden sm:flex items-center text-xs h-7 px-2.5 rounded-md hover:bg-accent text-indigo-500 font-medium transition-colors">
          Open Plan <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Sub-tabs */}
        <div className="flex border-b px-5 pt-2 gap-3">
          <button
            onClick={() => setActiveTab("schedule")}
            className={cn(
              "pb-2 text-xs font-medium border-b-2 transition-colors",
              activeTab === "schedule"
                ? "border-indigo-500 text-indigo-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            Schedule {schedule.length > 0 && `· ${schedule.length}`}
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={cn(
              "pb-2 text-xs font-medium border-b-2 transition-colors",
              activeTab === "tasks"
                ? "border-indigo-500 text-indigo-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            Tasks {tasks.length > 0 && `· ${tasks.length}`}
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse bg-muted h-2 w-1/3 rounded" />
          </div>
        ) : activeTab === "schedule" ? (
          <div className="flex-1 flex flex-col">
            {schedule.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <p className="text-xs text-muted-foreground mb-3">No blocks scheduled today.</p>
                <Link href="/plan" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                  Open Planner →
                </Link>
              </div>
            ) : (
              <div className="p-4 space-y-0">
                <div className="relative border-l-2 border-muted ml-2 pl-4 pt-1 pb-1 space-y-3">
                  {schedule.map((block) => (
                    <div key={block.id} className={cn("relative flex items-start justify-between gap-2", block.isCompleted && "opacity-40")}>
                      <div className={cn(
                        "absolute -left-[21px] mt-1.5 h-2 w-2 rounded-full ring-4 ring-background",
                        block.isCompleted ? "bg-muted-foreground"
                          : block.energyLevel === "High" ? "bg-blue-500"
                          : block.energyLevel === "Medium" ? "bg-indigo-500"
                          : block.type === "habit" ? "bg-orange-500"
                          : "bg-slate-500"
                      )} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-medium truncate", block.isCompleted && "line-through text-muted-foreground")}>
                          {block.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {block.startTime} – {block.endTime}
                        </p>
                      </div>
                      {block.isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-3">
                  <Link href="/plan" className="block text-center text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-lg py-1.5 transition-colors">
                    View full timeline
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {tasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <p className="text-xs text-muted-foreground mb-3">No tasks due today!</p>
                <Link href="/plan" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                  Add a task →
                </Link>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {tasks.map((task) => {
                  const cfg = PRIORITY_CONFIG[task.priority];
                  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline));
                  return (
                    <div key={task.id} className="flex items-center gap-2.5 py-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotColor)} />
                      <p className="text-xs font-medium truncate flex-1">{task.title}</p>
                      {isOverdue && (
                        <span className="text-[10px] text-red-400 shrink-0">Overdue</span>
                      )}
                    </div>
                  );
                })}
                <div className="pt-2">
                  <Link href="/plan?tab=tasks" className="block text-center text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-lg py-1.5 transition-colors">
                    View all tasks
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
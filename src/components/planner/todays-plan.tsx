"use client";

import { useEffect, useState } from "react";
import { getTodaySchedule, saveSchedule } from "@/lib/services/planner-service";
import { getTasks, updateTask } from "@/lib/services/task-service";
import { TimeBlock } from "@/lib/types/planner";
import { Task, PRIORITY_CONFIG } from "@/lib/types/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isToday, isPast } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export function TodaysPlan() {
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "tasks">("schedule");
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [blocks, allTasks] = await Promise.all([getTodaySchedule(), getTasks()]);
      setSchedule(blocks.slice(0, 6));
      const relevant = allTasks
        .filter(t => t.status !== "completed" && (
          !t.deadline || isToday(new Date(t.deadline)) || isPast(new Date(t.deadline))
        ))
        .slice(0, 6);
      setTasks(relevant);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleToggleBlock(block: TimeBlock) {
    const isCompleting = !block.isCompleted;
    const updated = schedule.map(b =>
      b.id === block.id ? { ...b, isCompleted: isCompleting } : b
    );
    setSchedule(updated);
    try {
      await saveSchedule(updated);
      // Sync linked task if exists
      if (block.sourceId) {
        await updateTask(block.sourceId, {
          status: isCompleting ? "completed" : "todo",
          completed_at: isCompleting ? new Date().toISOString() : null,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      load();
    }
  }

  async function handleToggleTask(task: Task) {
    const isCompleting = task.status !== "completed";
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, status: isCompleting ? "completed" : "todo" } : t
    ));
    try {
      await updateTask(task.id, {
        status: isCompleting ? "completed" : "todo",
        completed_at: isCompleting ? new Date().toISOString() : null,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      load();
    }
  }

  const scheduledTaskIds = new Set(schedule.filter(b => b.sourceId).map(b => b.sourceId!));
  const completedBlocks = schedule.filter(b => b.isCompleted).length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;

  return (
    <Card className="flex flex-col h-full bg-gradient-to-b from-card to-card/50">
      <CardHeader className="border-b pb-3 px-5 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          Today's Plan
        </CardTitle>
        <Link href="/plan"
          className="hidden sm:flex items-center text-xs h-7 px-2.5 rounded-md hover:bg-accent text-indigo-500 font-medium transition-colors">
          Open Plan <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Sub-tabs */}
        <div className="flex border-b px-5 gap-4">
          <button onClick={() => setActiveTab("schedule")}
            className={cn("pb-2 pt-2.5 text-xs font-medium border-b-2 transition-colors",
              activeTab === "schedule"
                ? "border-indigo-500 text-indigo-500"
                : "border-transparent text-muted-foreground hover:text-foreground")}>
            Schedule
            {schedule.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">{completedBlocks}/{schedule.length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab("tasks")}
            className={cn("pb-2 pt-2.5 text-xs font-medium border-b-2 transition-colors",
              activeTab === "tasks"
                ? "border-indigo-500 text-indigo-500"
                : "border-transparent text-muted-foreground hover:text-foreground")}>
            Tasks
            {tasks.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">{completedTasks}/{tasks.length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse bg-muted h-2 w-1/3 rounded" />
          </div>
        ) : activeTab === "schedule" ? (
          <div className="flex-1 flex flex-col">
            {schedule.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                <p className="text-xs text-muted-foreground">No blocks scheduled today.</p>
                <Link href="/plan" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                  Open Planner →
                </Link>
              </div>
            ) : (
              <div className="p-4 flex-1 flex flex-col">
                <div className="space-y-1.5">
                  {schedule.map((block) => (
                    <div key={block.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                        block.isCompleted
                          ? "opacity-50 bg-muted/10 border-transparent"
                          : "bg-card/50 border-border/50 hover:border-border"
                      )}>
                      <Checkbox
                        checked={!!block.isCompleted}
                        onCheckedChange={() => handleToggleBlock(block)}
                        className="rounded-full shrink-0 h-3.5 w-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-medium truncate",
                          block.isCompleted && "line-through text-muted-foreground")}>
                          {block.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />{block.startTime} – {block.endTime}
                        </p>
                      </div>
                      {block.isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-3 mt-auto">
                  <Link href="/plan"
                    className="block text-center text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-lg py-1.5 transition-colors">
                    View full timeline
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {tasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">No tasks due today!</p>
                <Link href="/plan" className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                  Add a task →
                </Link>
              </div>
            ) : (
              <div className="p-4 flex-1 flex flex-col">
                <div className="space-y-1.5">
                  {tasks.map((task) => {
                    const cfg = PRIORITY_CONFIG[task.priority];
                    const isDone = task.status === "completed";
                    const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline));
                    const isInPlanner = scheduledTaskIds.has(task.id);
                    return (
                      <div key={task.id}
                        className={cn(
                          "flex items-center gap-2.5 p-2.5 rounded-lg border transition-all",
                          isDone ? "opacity-50 bg-muted/10 border-transparent" : "bg-card/50 border-border/50 hover:border-border"
                        )}>
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => handleToggleTask(task)}
                          className="rounded-full shrink-0 h-3.5 w-3.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-medium truncate", isDone && "line-through text-muted-foreground")}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[10px]", cfg.color)}>{cfg.label}</span>
                            {isOverdue && <span className="text-[10px] text-red-400">· Overdue</span>}
                            {isInPlanner && (
                              <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                                · <CalendarDays className="h-2.5 w-2.5" /> In planner
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 mt-auto">
                  <Link href="/plan"
                    className="block text-center text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-lg py-1.5 transition-colors">
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
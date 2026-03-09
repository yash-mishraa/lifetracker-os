"use client";

import { useEffect, useState } from "react";
import { ActiveTimer } from "@/components/time/active-timer";
import { TimeDashboardStats } from "@/components/time/time-dashboard-stats";
import { TimeLogHistory } from "@/components/time/time-log-history";
import { 
  getTimeLogs, 
  saveTimeLog, 
  deleteTimeLog, 
  getTodayFocusTime, 
  getWeekFocusTime, 
  getProjectFocusTime 
} from "@/lib/services/time-service";
import { getTasks } from "@/lib/services/task-service";
import { TimeLog, TimeLogFormData, ProjectTimeStats } from "@/lib/types/time";
import { Task } from "@/lib/types/task";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimeTrackingPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  
  // Stats
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [weekSeconds, setWeekSeconds] = useState(0);
  const [projectStats, setProjectStats] = useState<ProjectTimeStats[]>([]);
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      // Fetch available tasks for the selector
      const allTasks = await getTasks();
      setTasks(allTasks);

      await refreshStatsAndLogs(allTasks);
    } catch (err: any) {
      toast({ title: "Error loading time data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatsAndLogs(currentTasks: Task[]) {
    try {
      // 1. Logs
      const recentLogs = await getTimeLogs();
      setLogs(recentLogs);
      
      // 2. Stats
      const today = await getTodayFocusTime();
      setTodaySeconds(today);
      
      const week = await getWeekFocusTime();
      setWeekSeconds(week);
      
      const pStats = await getProjectFocusTime(currentTasks);
      setProjectStats(pStats);
    } catch (err: any) {
      console.error("Error refreshing stats", err);
    }
  }

  const handleSaveLog = async (formData: TimeLogFormData) => {
    try {
      await saveTimeLog(formData);
      await refreshStatsAndLogs(tasks);
      toast({ title: "Time logged!", description: "Your session was successfully recorded." });
    } catch (err: any) {
      toast({ title: "Failed to save log", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteTimeLog(id);
      await refreshStatsAndLogs(tasks);
      toast({ title: "Log deleted" });
    } catch (err: any) {
      toast({ title: "Failed to delete log", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Record focus sessions and analyze your productivity.
            {!isSupabaseConfigured() && (
              <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600 ring-1 ring-inset ring-yellow-500/20">
                Local Storage Mode
              </span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Skeleton className="h-[400px] lg:col-span-5 rounded-xl" />
            <Skeleton className="h-[600px] lg:col-span-7 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Stats */}
          <TimeDashboardStats 
            todaySeconds={todaySeconds} 
            weekSeconds={weekSeconds} 
            projectStats={projectStats} 
          />

          {/* Grid Layout for Timer + History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 flex flex-col gap-6">
              <ActiveTimer tasks={tasks} onSaveLog={handleSaveLog} />
              
              <div className="bg-muted/30 border rounded-xl p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Time Tracking Tips:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Link a timer to a Task so it counts towards your Project Statistics.</li>
                  <li>Use the Pomodoro mode (25m Focus, 5m Break) to maintain high energy without burning out.</li>
                  <li>General untracked sessions or sessions shorter than 5 seconds will not be saved.</li>
                </ul>
              </div>
            </div>
            
            <div className="lg:col-span-7 h-[600px]">
              <TimeLogHistory 
                logs={logs} 
                tasks={tasks} 
                onDeleteLog={handleDeleteLog} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

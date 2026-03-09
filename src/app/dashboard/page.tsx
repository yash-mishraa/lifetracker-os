"use client";

import { useEffect, useState } from "react";
import { getTodaySummary, DashboardSummary } from "@/lib/services/dashboard-service";
import { getGamificationStats } from "@/lib/services/gamification-service";
import { GamificationStats } from "@/lib/types/gamification";
import { MetricRings } from "@/components/dashboard/metric-rings";
import { TodayTasksCard } from "@/components/dashboard/today-tasks-card";
import { TodayHabitsCard } from "@/components/dashboard/today-habits-card";
import { FocusSummaryCard } from "@/components/dashboard/focus-summary-card";
import { GoalsSummaryCard } from "@/components/dashboard/goals-summary-card";
import { TodaysPlan } from "@/components/planner/todays-plan"; // Added import
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ConsistencyScoreCard } from "@/components/dashboard/consistency-score-card";
import { StreaksShowcase } from "@/components/dashboard/streaks-showcase";
import { AchievementsGrid } from "@/components/dashboard/achievements-grid";
import { DisciplineScoreCard } from "@/components/dashboard/discipline-score-card";
import { getDisciplineHistory } from "@/lib/services/discipline-service";
import { DisciplineHistory } from "@/lib/types/discipline";
import { useToast } from "@/components/ui/use-toast";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [discipline, setDiscipline] = useState<DisciplineHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setErrorMsg(null);
      // Fetch concurrently to save time
      const [sumData, gamData, discData] = await Promise.all([
        getTodaySummary(),
        getGamificationStats(),
        getDisciplineHistory(7)
      ]);
      setSummary(sumData);
      setGamification(gamData);
      setDiscipline(discData);
    } catch (err: any) {
      console.error("Dashboard Load Error:", err);
      setErrorMsg(err.message || String(err));
      toast({ title: "Failed to load dashboard", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Triggered when a child component modifies data (like checking off a task)
  const handleDataChange = () => {
    loadDashboard();
  };

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Today</h1>
          <p className="text-muted-foreground">Your command center for the day.</p>
        </div>
        
        <div className="pt-1">
          <QuickActions onActionComplete={handleDataChange} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Skeleton className="h-[250px] lg:col-span-3 rounded-xl" />
            <Skeleton className="h-[250px] lg:col-span-1 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </div>
      ) : summary ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Top Row: Metric Rings & Score */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             <div className="lg:col-span-3">
               <MetricRings summary={summary} />
             </div>
             
             {/* Productivity Score Highlight */}
             <div className="lg:col-span-1 h-full min-h-[350px]">
                {discipline && <DisciplineScoreCard data={discipline} />}
             </div>
          </div>

          {/* Middle Row: Today's Timeline & Actionables */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TodaysPlan />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <TodayTasksCard initialTasks={summary.tasks.allDueToday} onTaskChange={handleDataChange} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <TodayHabitsCard initialHabits={summary.habits.allScheduledToday} onHabitChange={handleDataChange} />
          </div>
        </div>   {/* Bottom Row: Summaries (Focus & Goals) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-1">
               <FocusSummaryCard focusSeconds={summary.time.focusSecondsToday} />
             </div>
             <div className="md:col-span-2">
               <GoalsSummaryCard activeGoals={summary.goals.topActive} />
             </div>
          </div>

          {/* Gamification Row */}
          {gamification && (
            <>
              <div className="mt-8 mb-4 border-t pt-8">
                <h2 className="text-xl font-bold tracking-tight">Your Progress</h2>
                <p className="text-muted-foreground text-sm">Stay consistent to unlock more achievements.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-1 border rounded-xl shadow-sm bg-card hover:border-primary/20 transition-all">
                   <ConsistencyScoreCard score={gamification.consistencyScore} />
                 </div>
                 <div className="md:col-span-2 border rounded-xl shadow-sm bg-card hover:border-primary/20 transition-all">
                   <StreaksShowcase 
                     habits={gamification.streaks.habits} 
                     productivity={gamification.streaks.productivity} 
                     focus={gamification.streaks.focus} 
                   />
                 </div>
              </div>
              <div className="border rounded-xl shadow-sm bg-card hover:border-primary/20 transition-all">
                 <AchievementsGrid achievements={gamification.achievements} />
              </div>
            </>
          )}

        </div>
      ) : (
        <div className="h-[400px] flex flex-col items-center justify-center border rounded-xl bg-destructive/10 p-6 text-center">
           <p className="text-destructive font-bold text-lg mb-2">Failed to load data.</p>
           <p className="text-destructive/80 font-mono text-sm break-all">{errorMsg}</p>
        </div>
      )}

    </div>
  );
}

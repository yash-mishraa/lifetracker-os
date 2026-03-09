"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { HealthLog, HealthFormData } from "@/lib/types/health";
import { getHealthLogs, upsertHealthLog, deleteHealthLog } from "@/lib/services/health-service";
import { HealthLogDialog } from "@/components/health/health-log-dialog";
import { HealthHistoryTable } from "@/components/health/health-history-table";
import { HealthCharts } from "@/components/health/health-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Dumbbell, Apple, HeartPulse, Plus, Activity, Droplets } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function HealthPage() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
  
  const { toast } = useToast();
  
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLog = logs.find((l) => l.date === todayStr);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getHealthLogs();
      setLogs(data);
    } catch (error: any) {
      toast({ title: "Error loading health data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDialog = (log?: HealthLog) => {
    setEditingLog(log || null);
    setDialogOpen(true);
  };

  const handleSubmit = async (formData: HealthFormData) => {
    try {
      const saved = await upsertHealthLog(formData);
      
      setLogs((prev) => {
        const idx = prev.findIndex((l) => l.date === saved.date);
        if (idx >= 0) {
          const newArray = [...prev];
          newArray[idx] = saved;
          return newArray;
        }
        return [...prev, saved].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
      
      toast({ title: "Success", description: "Health log saved successfully." });
    } catch (error: any) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHealthLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Deleted", description: "Health log removed." });
    } catch (error: any) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    }
  };

  // Summary Metrics logic
  const sleepValue = todayLog?.sleep_hours ? `${todayLog.sleep_hours}h` : "—";
  const waterValue = todayLog?.water_intake ? `${todayLog.water_intake}L` : "—";
  const workoutValue = todayLog?.workout_done ? "Yes" : "—";
  const stepsValue = todayLog?.steps ? todayLog.steps.toLocaleString() : "—";

  const metrics = [
    { label: "Sleep", value: sleepValue, icon: Moon, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Water", value: waterValue, icon: Droplets, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Steps", value: stepsValue, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Workout", value: workoutValue, icon: Dumbbell, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Health</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Monitor and track your daily well-being.
            {!isSupabaseConfigured() && (
              <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600 ring-1 ring-inset ring-yellow-500/20">
                Local Storage Mode
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog(todayLog || undefined)}>
          <Plus className="mr-2 h-4 w-4" />
          {todayLog ? "Edit Today" : "Log Today"}
        </Button>
      </div>

      {/* Today's Summary */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Today's Summary</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="pt-6 pb-6">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${metric.bg} mb-4`}>
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{metric.value}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="trends" className="m-0 outline-none">
            {loading ? (
              <Skeleton className="h-[400px] w-full rounded-xl mt-2" />
            ) : (
              <HealthCharts logs={logs} days={14} />
            )}
          </TabsContent>
          
          <TabsContent value="history" className="m-0 outline-none">
            {loading ? (
              <div className="space-y-4 mt-2">
                 <Skeleton className="h-12 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
                 <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : (
              <HealthHistoryTable 
                logs={logs} 
                onEdit={handleOpenDialog} 
                onDelete={handleDelete} 
              />
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Entry Modal */}
      <HealthLogDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        log={editingLog} 
        onSubmit={handleSubmit} 
      />
    </div>
  );
}

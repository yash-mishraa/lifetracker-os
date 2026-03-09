"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Routine } from "@/lib/types/routine";
import { getRoutines, deleteRoutine } from "@/lib/services/routine-service";
import { RoutineChecklist } from "@/components/routines/routine-checklist";
import { RoutineManagerDialog } from "@/components/routines/routine-manager-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Track today for the checklist context
  const todayDate = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadRoutines();
  }, []);

  async function loadRoutines() {
    try {
      setLoading(true);
      const data = await getRoutines();
      setRoutines(data);
    } catch (err: any) {
      toast({ title: "Error loading routines", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to completely delete this routine and all its historical logs?")) return;
    try {
      await deleteRoutine(id);
      setRoutines(routines.filter(r => r.id !== id));
      toast({ title: "Routine deleted" });
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    }
  }

  // Grouping for UX
  const morningRoutines = routines.filter(r => r.type === "morning");
  const nightRoutines = routines.filter(r => r.type === "night");
  const otherRoutines = routines.filter(r => r.type === "other");

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Routines</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Build unshakeable daily momentum.
            <Sparkles className="h-4 w-4 text-amber-500" />
          </p>
        </div>
        <RoutineManagerDialog onSaved={loadRoutines}>
          <Button>Create Routine</Button>
        </RoutineManagerDialog>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-24 px-4 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/5">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No routines set up yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Routines group smaller actions together (like Meditate, Exercise, Read) so you build them as a unified habit loop.
          </p>
          <RoutineManagerDialog onSaved={loadRoutines}>
            <Button variant="secondary">Set Up Your First Routine</Button>
          </RoutineManagerDialog>
        </div>
      ) : (
        <div className="grid gap-8">
          
          {morningRoutines.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-amber-500 flex items-center gap-2">
                Morning
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {morningRoutines.map(routine => (
                  <div key={routine.id} className="relative group">
                    <RoutineChecklist routine={routine} date={todayDate} />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDelete(routine.id)}
                      className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nightRoutines.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                Evening
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {nightRoutines.map(routine => (
                  <div key={routine.id} className="relative group">
                    <RoutineChecklist routine={routine} date={todayDate} />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDelete(routine.id)}
                      className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherRoutines.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-emerald-500 flex items-center gap-2">
                Other Flow
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {otherRoutines.map(routine => (
                  <div key={routine.id} className="relative group">
                    <RoutineChecklist routine={routine} date={todayDate} />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDelete(routine.id)}
                      className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

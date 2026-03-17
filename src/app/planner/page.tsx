"use client";

import { useEffect, useState } from "react";
import { DailyTimeline } from "@/components/planner/daily-timeline";
import { getTodaySchedule, saveSchedule } from "@/lib/services/planner-service";
import { TimeBlock } from "@/lib/types/planner";
import { updateTask } from "@/lib/services/task-service";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, Zap, Plus } from "lucide-react";
import { generateAutoSchedule } from "@/lib/services/planner-service";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);
}

export default function PlannerPage() {
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBlock, setNewBlock] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    type: "task" as TimeBlock["type"],
    energyLevel: "Medium" as TimeBlock["energyLevel"],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    setLoading(true);
    try {
      const blocks = await getTodaySchedule();
      setSchedule(blocks);
    } catch (err: any) {
      toast({ title: "Failed to load schedule", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoSchedule() {
    setIsRegenerating(true);
    try {
      const newBlocks = await generateAutoSchedule();
      setSchedule(newBlocks);
      await saveSchedule(newBlocks);
      toast({ title: "Schedule Regenerated", description: "Your day has been optimized based on energy levels." });
    } catch (err: any) {
      toast({ title: "Failed to regenerate", description: err.message, variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  }

  async function handleScheduleChange(updatedBlocks: TimeBlock[]) {
    setSchedule(updatedBlocks);
    try {
      await saveSchedule(updatedBlocks);
    } catch (err) {
      console.error("Failed to save schedule change", err);
    }
  }

  async function handleToggleComplete(id: string, isCompleted: boolean) {
    setSchedule(prev => prev.map(b => b.id === id ? { ...b, isCompleted } : b));

    const block = schedule.find(b => b.id === id);
    if (!block || !block.sourceId) return;

    try {
      if (block.type === "task") {
        const status = isCompleted ? "completed" : "todo";
        await updateTask(block.sourceId, { status });
      }

      const newSchedule = schedule.map(b => b.id === id ? { ...b, isCompleted } : b);
      await saveSchedule(newSchedule);

      if (isCompleted) {
        toast({ title: "Marked as complete!" });
      }
    } catch (err: any) {
      setSchedule(prev => prev.map(b => b.id === id ? { ...b, isCompleted: !isCompleted } : b));
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    }
  }

  async function handleAddBlock() {
    if (!newBlock.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    const block: TimeBlock = {
      id: generateId(),
      title: newBlock.title.trim(),
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      type: newBlock.type,
      energyLevel: newBlock.energyLevel,
      isCompleted: false,
      isLocked: false,
    };

    const updatedSchedule = [...schedule, block];
    setSchedule(updatedSchedule);
    setShowAddDialog(false);
    setNewBlock({ title: "", startTime: "09:00", endTime: "10:00", type: "task", energyLevel: "Medium" });

    try {
      await saveSchedule(updatedSchedule);
      toast({ title: "Block added to your schedule." });
    } catch (err: any) {
      toast({ title: "Failed to save block", description: err.message, variant: "destructive" });
    }
  }

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight py-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Smart Daily Planner
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Energy-optimized scheduling for peak productivity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAddDialog(true)}
            disabled={loading}
            variant="outline"
            className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
          <Button
            onClick={handleAutoSchedule}
            disabled={isRegenerating || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
            Auto-Schedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Main Timeline Board */}
        <div className="bg-card/30 border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Today's Timeline</h2>
              <p className="text-sm text-muted-foreground">Drag to reorder and adjust times</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(idx => (
                <Skeleton key={idx} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : schedule.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg bg-muted/20">
              <p className="text-muted-foreground mb-4">Nothing scheduled for today yet.</p>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddDialog(true)} variant="outline" size="sm">
                  <Plus className="mr-1 h-3 w-3" /> Add Manually
                </Button>
                <Button onClick={handleAutoSchedule} variant="outline" size="sm">
                  Generate Schedule
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-[400px]">
              <DailyTimeline
                initialBlocks={schedule}
                onScheduleChange={handleScheduleChange}
                onToggleComplete={handleToggleComplete}
              />
            </div>
          )}
        </div>

        {/* Energy Map Legend Sidebar */}
        <div className="space-y-6">
          <div className="bg-card/50 border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 tracking-wide uppercase text-muted-foreground">Energy Map</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500 mt-1 shrink-0 ring-4 ring-blue-500/20" />
                <div>
                  <p className="font-medium text-blue-500">Morning (High Energy)</p>
                  <p className="text-muted-foreground text-xs">Deep work, complex tasks, high priority items.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-indigo-500 mt-1 shrink-0 ring-4 ring-indigo-500/20" />
                <div>
                  <p className="font-medium text-indigo-500">Afternoon (Medium)</p>
                  <p className="text-muted-foreground text-xs">Meetings, admin, medium priority tasks.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-slate-500 mt-1 shrink-0 ring-4 ring-slate-500/20" />
                <div>
                  <p className="font-medium text-slate-500">Evening (Low/Routine)</p>
                  <p className="text-muted-foreground text-xs">Habits, reading, planning for tomorrow.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-emerald-600 mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Smart Tips
            </h3>
            <p className="text-xs text-emerald-600/80 leading-relaxed">
              The Auto-Scheduler uses estimated durations (defaulting to 60m) and sorts your outstanding logic into these energy blocks. Locked blocks (like Lunch) force the timeline to jump.
            </p>
          </div>
        </div>
      </div>

      {/* Add Block Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Time Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="block-title">Title</Label>
              <Input
                id="block-title"
                placeholder="e.g. Deep work session"
                value={newBlock.title}
                onChange={e => setNewBlock(prev => ({ ...prev, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleAddBlock()}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newBlock.startTime}
                  onChange={e => setNewBlock(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newBlock.endTime}
                  onChange={e => setNewBlock(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={newBlock.type}
                  onValueChange={val => setNewBlock(prev => ({ ...prev, type: val as TimeBlock["type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="habit">Habit</SelectItem>
                    <SelectItem value="focus">Focus</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Energy Level</Label>
                <Select
                  value={newBlock.energyLevel}
                  onValueChange={val => setNewBlock(prev => ({ ...prev, energyLevel: val as TimeBlock["energyLevel"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddBlock} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Add Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
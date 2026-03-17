"use client";

import { useEffect, useState } from "react";
import { DailyTimeline } from "@/components/planner/daily-timeline";
import { getTodaySchedule, saveSchedule } from "@/lib/services/planner-service";
import { TimeBlock, BlockType, EnergyLevel } from "@/lib/types/planner";
import { updateTask } from "@/lib/services/task-service";
import { Button } from "@/components/ui/button";
import { Calendar, Zap, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const EMPTY_FORM = {
  title: "",
  description: "",
  startTime: "09:00",
  endTime: "10:00",
  type: "task" as BlockType,
  energyLevel: "Medium" as EnergyLevel,
  isLocked: false,
};

export default function PlannerPage() {
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
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

  async function persistSchedule(blocks: TimeBlock[]) {
    setSchedule(blocks);
    try {
      await saveSchedule(blocks);
    } catch (err) {
      console.error("Failed to save schedule", err);
    }
  }

  function openAdd() {
    setEditingBlock(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  function openEdit(block: TimeBlock) {
    setEditingBlock(block);
    setForm({
      title: block.title,
      description: block.description ?? "",
      startTime: block.startTime,
      endTime: block.endTime,
      type: block.type,
      energyLevel: block.energyLevel ?? "Medium",
      isLocked: block.isLocked ?? false,
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    if (editingBlock) {
      const updated = schedule.map(b =>
        b.id === editingBlock.id
          ? { ...b, ...form, description: form.description || undefined }
          : b
      );
      await persistSchedule(updated);
      toast({ title: "Block updated." });
    } else {
      const block: TimeBlock = {
        id: generateId(),
        ...form,
        description: form.description || undefined,
        isCompleted: false,
      };
      await persistSchedule([...schedule, block]);
      toast({ title: "Block added." });
    }

    setShowDialog(false);
  }

  async function handleDelete(id: string) {
    await persistSchedule(schedule.filter(b => b.id !== id));
    setDeleteId(null);
    toast({ title: "Block removed." });
  }

  async function handleToggleComplete(id: string, isCompleted: boolean) {
    const updated = schedule.map(b => b.id === id ? { ...b, isCompleted } : b);
    setSchedule(updated);

    const block = schedule.find(b => b.id === id);
    if (block?.sourceId && block.type === "task") {
      try {
        await updateTask(block.sourceId, { status: isCompleted ? "completed" : "todo" });
      } catch (err: any) {
        toast({ title: "Action failed", description: err.message, variant: "destructive" });
        setSchedule(schedule);
        return;
      }
    }

    try {
      await saveSchedule(updated);
      if (isCompleted) toast({ title: "Marked as complete!" });
    } catch (err) {
      console.error("Failed to save", err);
    }
  }

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight py-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Daily Planner
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Plan your day, block by block.
          </p>
        </div>
        <Button
          onClick={openAdd}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Block
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Main Timeline */}
        <div className="bg-card/30 border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Today's Timeline</h2>
              <p className="text-sm text-muted-foreground">Drag to reorder · click pencil to edit</p>
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
              <Button onClick={openAdd} variant="outline" size="sm">
                <Plus className="mr-1 h-3 w-3" /> Add your first block
              </Button>
            </div>
          ) : (
            <div className="min-h-[400px]">
              <DailyTimeline
                initialBlocks={schedule}
                onScheduleChange={persistSchedule}
                onToggleComplete={handleToggleComplete}
                onEdit={openEdit}
                onDelete={(id) => setDeleteId(id)}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card/50 border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 tracking-wide uppercase text-muted-foreground">Energy Map</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-blue-500 mt-1 shrink-0 ring-4 ring-blue-500/20" />
                <div>
                  <p className="font-medium text-blue-500">High Energy</p>
                  <p className="text-muted-foreground text-xs">Deep work, complex tasks, high priority items.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-indigo-500 mt-1 shrink-0 ring-4 ring-indigo-500/20" />
                <div>
                  <p className="font-medium text-indigo-500">Medium Energy</p>
                  <p className="text-muted-foreground text-xs">Meetings, admin, medium priority tasks.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-3 w-3 rounded-full bg-slate-500 mt-1 shrink-0 ring-4 ring-slate-500/20" />
                <div>
                  <p className="font-medium text-slate-500">Low Energy</p>
                  <p className="text-muted-foreground text-xs">Habits, reading, light tasks.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card/50 border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 tracking-wide uppercase text-muted-foreground">Block Types</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Task — actionable to-dos</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500" /> Habit — recurring behaviours</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-500" /> Focus — deep work sessions</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" /> Break — rest & recovery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Edit Block" : "Add Time Block"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="block-title">Title</Label>
              <Input
                id="block-title"
                placeholder="e.g. Deep work session"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSave()}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="block-desc">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="block-desc"
                placeholder="Add notes..."
                rows={2}
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={val => setForm(p => ({ ...p, type: val as BlockType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={form.energyLevel} onValueChange={val => setForm(p => ({ ...p, energyLevel: val as EnergyLevel }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {editingBlock ? "Save Changes" : "Add Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this block?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the block from today's schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
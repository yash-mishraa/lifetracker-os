"use client";

import { useEffect, useState, useCallback } from "react";

// ── Planner imports ──────────────────────────────────────────────────────────
import { DailyTimeline } from "@/components/planner/daily-timeline";
import { getScheduleForDate, saveScheduleForDate } from "@/lib/services/planner-service";
import { TimeBlock, BlockType, EnergyLevel } from "@/lib/types/planner";

// ── Task imports ─────────────────────────────────────────────────────────────
import {
  Task, Project, TaskFilter, TaskFormData, DEFAULT_TASK_FORM, PRIORITY_CONFIG,
} from "@/lib/types/task";
import {
  getTasks, createTask, updateTask, deleteTask,
  toggleTaskComplete, getSubtasks, createSubtask,
  getProjects, getAllTags,
} from "@/lib/services/task-service";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskKanbanView } from "@/components/tasks/task-kanban-view";
import { TaskTodayView } from "@/components/tasks/task-today-view";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";

// ── UI ───────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus, ChevronLeft, ChevronRight, CalendarDays, List,
  Columns3, Sun, CalendarPlus, Clock, Pencil, Trash2,
  CheckCircle2, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
  isPast,
} from "date-fns";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);
}

const EMPTY_BLOCK_FORM = {
  title: "", description: "", startTime: "09:00", endTime: "10:00",
  type: "task" as BlockType, energyLevel: "Medium" as EnergyLevel, isLocked: false,
};

function priorityToEnergy(priority: string): EnergyLevel {
  if (priority === "critical" || priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Calendar
// ─────────────────────────────────────────────────────────────────────────────

interface MiniCalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
  scheduledDates: Set<string>;
}

function MiniCalendar({ selected, onSelect, scheduledDates }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected));
  const weeks: Date[][] = [];
  const calStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1); }
    weeks.push(week);
  }
  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold">{format(viewMonth, "MMMM yyyy")}</span>
        <button onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-muted-foreground/50 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {weeks.flat().map((d, i) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const isSelected = isSameDay(d, selected);
          const inMonth = isSameMonth(d, viewMonth);
          const isTodayDate = isToday(d);
          const hasBlocks = scheduledDates.has(dateStr);
          return (
            <button key={i} onClick={() => onSelect(d)}
              className={cn(
                "relative h-8 w-full flex items-center justify-center rounded-full text-xs font-medium transition-all",
                !inMonth && "opacity-20",
                isSelected ? "bg-foreground text-background"
                  : isTodayDate ? "text-indigo-400 font-bold"
                  : "hover:bg-muted/60 text-foreground",
              )}>
              {format(d, "d")}
              {hasBlocks && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced Task Row (Tasks tab) — with Schedule button
// ─────────────────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  subtasks: Task[];
  scheduledIds: Set<string>;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onSchedule: (task: Task) => void;
}

function TaskRow({ task, subtasks, scheduledIds, onToggle, onEdit, onDelete, onSchedule }: TaskRowProps) {
  const cfg = PRIORITY_CONFIG[task.priority];
  const isCompleted = task.status === "completed";
  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline)) && !isCompleted;
  const isDueToday = task.deadline && isToday(new Date(task.deadline)) && !isCompleted;
  const isScheduled = scheduledIds.has(task.id);

  return (
    <div className={cn(
      "group flex items-start gap-3 p-3 rounded-xl border transition-all",
      isCompleted ? "opacity-50 bg-muted/10 border-muted/30" : "bg-card/50 border-border hover:border-border/80 hover:shadow-sm",
      isOverdue && "border-red-500/20",
    )}>
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggle(task)}
        className="mt-0.5 rounded-full shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isCompleted && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          <Badge variant="secondary" className={cn("text-[10px] gap-1 px-1.5 py-0 h-4", cfg.bgColor, cfg.color)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotColor)} />
            {cfg.label}
          </Badge>
          {task.deadline && (
            <span className={cn("text-[10px] flex items-center gap-1",
              isOverdue ? "text-red-400" : isDueToday ? "text-amber-400" : "text-muted-foreground")}>
              <CalendarDays className="h-3 w-3" />
              {format(new Date(task.deadline), "MMM d")}
              {isOverdue && " · Overdue"}
            </span>
          )}
          {task.estimated_minutes > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />{task.estimated_minutes}m
            </span>
          )}
          {subtasks.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {subtasks.filter(s => s.status === "completed").length}/{subtasks.length} subtasks
            </span>
          )}
          {isScheduled && (
            <span className="text-[10px] text-indigo-400 flex items-center gap-1">
              <CalendarPlus className="h-3 w-3" /> Scheduled
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!isCompleted && (
          <Button
            size="sm"
            variant={isScheduled ? "secondary" : "outline"}
            onClick={() => onSchedule(task)}
            className={cn(
              "h-7 text-[11px] px-2 gap-1",
              isScheduled
                ? "text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20"
                : "text-muted-foreground hover:text-indigo-400 hover:border-indigo-500/30"
            )}
          >
            <CalendarPlus className="h-3 w-3" />
            {isScheduled ? "Scheduled" : "Schedule"}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7" />}>
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule Task Dialog
// ─────────────────────────────────────────────────────────────────────────────

interface ScheduleTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (task: Task, date: Date, startTime: string, endTime: string) => void;
}

function ScheduleTaskDialog({ task, open, onOpenChange, onConfirm }: ScheduleTaskDialogProps) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState(() => {
    const mins = task?.estimated_minutes || 60;
    const h = 9 + Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  });

  useEffect(() => {
    if (task) {
      const mins = task.estimated_minutes || 60;
      const [sh, sm] = startTime.split(":").map(Number);
      const total = sh * 60 + sm + mins;
      setEndTime(`${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`);
    }
  }, [task, startTime]);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Schedule Task</DialogTitle>
          <p className="text-xs text-muted-foreground truncate pt-0.5">{task.title}</p>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          {task.estimated_minutes > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Estimated duration: {task.estimated_minutes} min
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => { onConfirm(task, new Date(date + "T00:00:00"), startTime, endTime); onOpenChange(false); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Add to Planner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TopTab = "planner" | "tasks";
type TaskView = "list" | "kanban" | "today" | "calendar";

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const { toast } = useToast();

  const [topTab, setTopTab] = useState<TopTab>("planner");

  // ── Planner ────────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(true);
  const [scheduledDates, setScheduledDates] = useState<Set<string>>(new Set());
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState(EMPTY_BLOCK_FORM);

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskView, setTaskView] = useState<TaskView>("list");
  const [filter, setFilter] = useState<TaskFilter>({
    priority: "all", status: "all", project_id: "all", tag: "all", search: "",
  });
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // ── Schedule-task dialog ───────────────────────────────────────────────────
  const [scheduleTask, setScheduleTask] = useState<Task | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // ── Scheduled task IDs (sourceId set) across ALL dates ────────────────────
  // We track which task IDs are already in today's schedule for the badge
  const scheduledTaskIds: Set<string> = new Set(
    schedule.filter(b => b.sourceId).map(b => b.sourceId!)
  );

  // ── Load planner ───────────────────────────────────────────────────────────
  const loadSchedule = useCallback(async (date: Date) => {
    setPlannerLoading(true);
    try {
      const blocks = await getScheduleForDate(date);
      setSchedule(blocks);
      if (blocks.length > 0)
        setScheduledDates(prev => new Set([...prev, format(date, "yyyy-MM-dd")]));
    } catch (err: any) {
      toast({ title: "Failed to load schedule", description: err.message, variant: "destructive" });
    } finally { setPlannerLoading(false); }
  }, [toast]);

  useEffect(() => { loadSchedule(selectedDate); }, [selectedDate, loadSchedule]);

  // ── Load tasks ─────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const [tasksData, projectsData] = await Promise.all([getTasks(filter), getProjects()]);
      setTasks(tasksData);
      setProjects(projectsData);
      const subMap: Record<string, Task[]> = {};
      await Promise.all(tasksData.map(async (t) => {
        const subs = await getSubtasks(t.id);
        if (subs.length > 0) subMap[t.id] = subs;
      }));
      setSubtasksMap(subMap);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally { setTasksLoading(false); }
  }, [filter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ── Planner handlers ───────────────────────────────────────────────────────
  async function persistSchedule(blocks: TimeBlock[], date: Date = selectedDate) {
    setSchedule(blocks);
    try {
      await saveScheduleForDate(date, blocks);
      if (blocks.length > 0)
        setScheduledDates(prev => new Set([...prev, format(date, "yyyy-MM-dd")]));
    } catch (err) { console.error("Failed to save schedule", err); }
  }

  function openAddBlock() {
    setEditingBlock(null);
    setBlockForm(EMPTY_BLOCK_FORM);
    setShowBlockDialog(true);
  }

  function openEditBlock(block: TimeBlock) {
    setEditingBlock(block);
    setBlockForm({
      title: block.title, description: block.description ?? "",
      startTime: block.startTime, endTime: block.endTime,
      type: block.type, energyLevel: block.energyLevel ?? "Medium",
      isLocked: block.isLocked ?? false,
    });
    setShowBlockDialog(true);
  }

  async function handleSaveBlock() {
    if (!blockForm.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    if (editingBlock) {
      await persistSchedule(schedule.map(b =>
        b.id === editingBlock.id ? { ...b, ...blockForm, description: blockForm.description || undefined } : b
      ));
      toast({ title: "Block updated." });
    } else {
      const block: TimeBlock = {
        id: generateId(), ...blockForm,
        description: blockForm.description || undefined, isCompleted: false,
      };
      await persistSchedule([...schedule, block]);
      toast({ title: "Block added." });
    }
    setShowBlockDialog(false);
  }

  async function handleDeleteBlock(id: string) {
    await persistSchedule(schedule.filter(b => b.id !== id));
    setDeleteBlockId(null);
    toast({ title: "Block removed." });
  }

  async function handleToggleComplete(id: string, isCompleted: boolean) {
    const updated = schedule.map(b => b.id === id ? { ...b, isCompleted } : b);
    setSchedule(updated);
    const block = schedule.find(b => b.id === id);
    // Sync back to task if linked
    if (block?.sourceId && block.type === "task") {
      try {
        await updateTask(block.sourceId, { status: isCompleted ? "completed" : "todo" });
        // Refresh tasks so status badge updates in Tasks tab too
        loadTasks();
      } catch (err: any) {
        toast({ title: "Action failed", description: err.message, variant: "destructive" });
        setSchedule(schedule);
        return;
      }
    }
    try { await saveScheduleForDate(selectedDate, updated); } catch {}
    if (isCompleted) toast({ title: "Marked as complete!" });
  }

  // ── Schedule a task into the planner ──────────────────────────────────────
  async function handleScheduleTaskConfirm(task: Task, date: Date, startTime: string, endTime: string) {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingBlocks = await getScheduleForDate(date);

    // Don't double-add
    if (existingBlocks.some(b => b.sourceId === task.id)) {
      toast({ title: "Already scheduled", description: `"${task.title}" is already in that day's planner.` });
      return;
    }

    const block: TimeBlock = {
      id: generateId(),
      type: "task",
      title: task.title,
      description: task.description || undefined,
      energyLevel: priorityToEnergy(task.priority),
      startTime,
      endTime,
      sourceId: task.id,
      isCompleted: task.status === "completed",
      isLocked: false,
    };

    const updated = [...existingBlocks, block].sort((a, b) => a.startTime.localeCompare(b.startTime));
    await saveScheduleForDate(date, updated);
    setScheduledDates(prev => new Set([...prev, dateStr]));

    // If scheduled for currently selected date, refresh timeline
    if (isSameDay(date, selectedDate)) {
      setSchedule(updated);
    }

    toast({
      title: "Scheduled!",
      description: `"${task.title}" added to ${isToday(date) ? "today's" : format(date, "MMM d's")} planner.`,
    });
  }

  // ── Task handlers ──────────────────────────────────────────────────────────
  const handleCreateTask = async (data: TaskFormData) => { await createTask(data); loadTasks(); };
  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, data);
    setEditingTask(null); loadTasks();
  };
  const handleDeleteTask = async (task: Task) => { await deleteTask(task.id); loadTasks(); };
  const handleToggleTaskComplete = async (task: Task) => {
    await toggleTaskComplete(task);
    loadTasks();
    // Sync to planner block if it exists in current schedule
    const linked = schedule.find(b => b.sourceId === task.id);
    if (linked) {
      const isCompleting = task.status !== "completed";
      const updated = schedule.map(b => b.id === linked.id ? { ...b, isCompleted: isCompleting } : b);
      setSchedule(updated);
      await saveScheduleForDate(selectedDate, updated);
    }
  };
  const handleEditTask = (task: Task) => { setEditingTask(task); setTaskDialogOpen(true); };

  // ── Derived ────────────────────────────────────────────────────────────────
  const isSelectedToday = isToday(selectedDate);
  const dateLabel = isSelectedToday ? "Today" : format(selectedDate, "EEEE, d MMM");
  const allTags = getAllTags(tasks);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your tasks and daily schedule, unified.</p>
        </div>
        <div className="flex items-center bg-muted/40 border rounded-xl p-1 gap-1">
          <button onClick={() => setTopTab("planner")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              topTab === "planner" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            <CalendarDays className="h-3.5 w-3.5" /> Planner
          </button>
          <button onClick={() => setTopTab("tasks")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              topTab === "tasks" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
            <List className="h-3.5 w-3.5" /> Tasks
            {tasks.filter(t => t.status !== "completed").length > 0 && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                {tasks.filter(t => t.status !== "completed").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════ PLANNER TAB ══════════════════ */}
      {topTab === "planner" && (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
          <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} scheduledDates={scheduledDates} />
            </div>
            {!isSelectedToday && (
              <button onClick={() => setSelectedDate(new Date())}
                className="w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1">
                Jump to today
              </button>
            )}
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">Block types</p>
              {[
                { color: "bg-blue-500", label: "Task" },
                { color: "bg-orange-500", label: "Habit" },
                { color: "bg-purple-500", label: "Focus" },
                { color: "bg-green-500", label: "Break" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2.5 mb-2 last:mb-0">
                  <span className={cn("h-2 w-2 rounded-full", color)} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            {/* Unscheduled tasks quick-view */}
            {tasks.filter(t => t.status !== "completed" && !scheduledTaskIds.has(t.id)).length > 0 && (
              <div className="bg-card border rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
                  Unscheduled Tasks
                </p>
                <div className="space-y-2">
                  {tasks.filter(t => t.status !== "completed" && !scheduledTaskIds.has(t.id)).slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", PRIORITY_CONFIG[task.priority].dotColor)} />
                        <span className="text-xs text-muted-foreground truncate">{task.title}</span>
                      </div>
                      <button
                        onClick={() => { setScheduleTask(task); setScheduleDialogOpen(true); }}
                        className="shrink-0 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                      >
                        <CalendarPlus className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {tasks.filter(t => t.status !== "completed" && !scheduledTaskIds.has(t.id)).length > 4 && (
                    <button onClick={() => setTopTab("tasks")}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-left pt-1">
                      +{tasks.filter(t => t.status !== "completed" && !scheduledTaskIds.has(t.id)).length - 4} more → view all tasks
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-card/30 border rounded-2xl p-6 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-5 pb-4 border-b">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedDate(d => addDays(d, -1))}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <div>
                  <h2 className="text-base font-semibold leading-tight">{dateLabel}</h2>
                  {!isSelectedToday && <p className="text-[11px] text-muted-foreground">{format(selectedDate, "yyyy")}</p>}
                </div>
                <button onClick={() => setSelectedDate(d => addDays(d, 1))}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{schedule.length} {schedule.length === 1 ? "block" : "blocks"}</span>
                <Button onClick={openAddBlock} size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 h-8">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Block
                </Button>
              </div>
            </div>

            {plannerLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : schedule.length === 0 ? (
              <div className="h-[280px] flex flex-col items-center justify-center gap-3 border border-dashed rounded-xl bg-muted/10">
                <p className="text-sm text-muted-foreground">
                  {isSelectedToday ? "Nothing planned for today." : `Nothing planned for ${format(selectedDate, "MMM d")}.`}
                </p>
                <div className="flex gap-2">
                  <Button onClick={openAddBlock} variant="outline" size="sm">
                    <Plus className="mr-1 h-3 w-3" /> Add block
                  </Button>
                  {tasks.filter(t => t.status !== "completed").length > 0 && (
                    <Button onClick={() => setTopTab("tasks")} variant="outline" size="sm"
                      className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10">
                      <CalendarPlus className="mr-1 h-3 w-3" /> Schedule a task
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <DailyTimeline
                initialBlocks={schedule}
                onScheduleChange={persistSchedule}
                onToggleComplete={handleToggleComplete}
                onEdit={openEditBlock}
                onDelete={(id) => setDeleteBlockId(id)}
              />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════ TASKS TAB ══════════════════ */}
      {topTab === "tasks" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TaskFilters filter={filter} onFilterChange={setFilter} projects={projects} allTags={allTags} />
            <Button size="sm" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" /> New Task
            </Button>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-1 bg-muted/30 border rounded-xl p-1 w-fit">
            {([
              { id: "list", icon: List, label: "List" },
              { id: "kanban", icon: Columns3, label: "Kanban" },
              { id: "today", icon: Sun, label: "Today" },
              { id: "calendar", icon: CalendarDays, label: "Calendar" },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTaskView(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  taskView === id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {tasksLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-card/40">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* List view — enhanced with Schedule button */}
              {taskView === "list" && (
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground/20 mb-4" />
                      <p className="text-sm text-muted-foreground">No tasks found</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Create a task to get started</p>
                    </div>
                  ) : tasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      subtasks={subtasksMap[task.id] || []}
                      scheduledIds={scheduledTaskIds}
                      onToggle={handleToggleTaskComplete}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onSchedule={(t) => { setScheduleTask(t); setScheduleDialogOpen(true); }}
                    />
                  ))}
                </div>
              )}
              {taskView === "kanban" && (
                <TaskKanbanView tasks={tasks} subtasksMap={subtasksMap}
                  onToggleComplete={handleToggleTaskComplete} onEdit={handleEditTask} onDelete={handleDeleteTask} />
              )}
              {taskView === "today" && (
                <TaskTodayView tasks={tasks} subtasksMap={subtasksMap}
                  onToggleComplete={handleToggleTaskComplete} onEdit={handleEditTask} onDelete={handleDeleteTask} />
              )}
              {taskView === "calendar" && (
                <TaskCalendarView tasks={tasks} onEdit={handleEditTask} />
              )}
            </>
          )}
        </div>
      )}

      {/* ══ Block Add/Edit Dialog ══ */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlock ? "Edit Block" : "Add Block"}</DialogTitle>
            <p className="text-xs text-muted-foreground pt-0.5">{format(selectedDate, "EEEE, MMMM d")}</p>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="e.g. Deep work session" value={blockForm.title}
                onChange={e => setBlockForm(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSaveBlock()} />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea placeholder="Add notes..." rows={2} value={blockForm.description}
                onChange={e => setBlockForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input type="time" value={blockForm.startTime} onChange={e => setBlockForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="time" value={blockForm.endTime} onChange={e => setBlockForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={blockForm.type} onValueChange={val => setBlockForm(p => ({ ...p, type: val as BlockType }))}>
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
                <Label>Energy</Label>
                <Select value={blockForm.energyLevel} onValueChange={val => setBlockForm(p => ({ ...p, energyLevel: val as EnergyLevel }))}>
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
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveBlock} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {editingBlock ? "Save Changes" : "Add Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Block Delete ══ */}
      <AlertDialog open={!!deleteBlockId} onOpenChange={(open: boolean) => !open && setDeleteBlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this block?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the block from {isSelectedToday ? "today's" : format(selectedDate, "MMM d's")} schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteBlockId && handleDeleteBlock(deleteBlockId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══ Task Dialog ══ */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => { setTaskDialogOpen(open); if (!open) setEditingTask(null); }}
        task={editingTask}
        projects={projects}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />

      {/* ══ Schedule Task Dialog ══ */}
      <ScheduleTaskDialog
        task={scheduleTask}
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onConfirm={handleScheduleTaskConfirm}
      />
    </div>
  );
}
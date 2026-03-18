"use client";

import { useEffect, useState, useCallback } from "react";

// ── Planner imports ──────────────────────────────────────────────────────────
import { DailyTimeline } from "@/components/planner/daily-timeline";
import { getScheduleForDate, saveScheduleForDate } from "@/lib/services/planner-service";
import { TimeBlock, BlockType, EnergyLevel } from "@/lib/types/planner";

// ── Task imports ─────────────────────────────────────────────────────────────
import {
  Task, Project, TaskFilter, TaskFormData, DEFAULT_TASK_FORM,
} from "@/lib/types/task";
import {
  getTasks, createTask, updateTask, deleteTask,
  toggleTaskComplete, getSubtasks, createSubtask,
  getProjects, getAllTags,
} from "@/lib/services/task-service";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskKanbanView } from "@/components/tasks/task-kanban-view";
import { TaskTodayView } from "@/components/tasks/task-today-view";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";

// ── UI ───────────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  Plus, ChevronLeft, ChevronRight,
  CalendarDays, List, Columns3, Sun, LayoutGrid,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
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
// Top-level tab type
// ─────────────────────────────────────────────────────────────────────────────

type TopTab = "planner" | "tasks";
type TaskView = "list" | "kanban" | "today" | "calendar";

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const { toast } = useToast();

  // ── Top tab ────────────────────────────────────────────────────────────────
  const [topTab, setTopTab] = useState<TopTab>("planner");

  // ── Planner state ──────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [plannerLoading, setPlannerLoading] = useState(true);
  const [scheduledDates, setScheduledDates] = useState<Set<string>>(new Set());
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState(EMPTY_BLOCK_FORM);

  // ── Task state ─────────────────────────────────────────────────────────────
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
    if (block?.sourceId && block.type === "task") {
      try { await updateTask(block.sourceId, { status: isCompleted ? "completed" : "todo" }); }
      catch (err: any) { toast({ title: "Action failed", description: err.message, variant: "destructive" }); setSchedule(schedule); return; }
    }
    try { await saveScheduleForDate(selectedDate, updated); } catch {}
    if (isCompleted) toast({ title: "Marked as complete!" });
  }

  // ── Task handlers ──────────────────────────────────────────────────────────
  const handleCreateTask = async (data: TaskFormData) => { await createTask(data); loadTasks(); };
  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, data);
    setEditingTask(null); loadTasks();
  };
  const handleDeleteTask = async (task: Task) => { await deleteTask(task.id); loadTasks(); };
  const handleToggleTaskComplete = async (task: Task) => { await toggleTaskComplete(task); loadTasks(); };
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

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your tasks and daily schedule, unified.</p>
        </div>

        {/* Top tabs — pill style */}
        <div className="flex items-center bg-muted/40 border rounded-xl p-1 gap-1">
          <button
            onClick={() => setTopTab("planner")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              topTab === "planner"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}>
            <CalendarDays className="h-3.5 w-3.5" /> Planner
          </button>
          <button
            onClick={() => setTopTab("tasks")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              topTab === "tasks"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}>
            <List className="h-3.5 w-3.5" /> Tasks
          </button>
        </div>
      </div>

      {/* ══════════════════════════ PLANNER TAB ══════════════════════════ */}
      {topTab === "planner" && (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">

          {/* Left sidebar */}
          <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-5 shadow-sm">
              <MiniCalendar
                selected={selectedDate}
                onSelect={setSelectedDate}
                scheduledDates={scheduledDates}
              />
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
          </div>

          {/* Timeline panel */}
          <div className="bg-card/30 border rounded-2xl p-6 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-5 pb-4 border-b">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedDate(d => addDays(d, -1))}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors">
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <div>
                  <h2 className="text-base font-semibold leading-tight">{dateLabel}</h2>
                  {!isSelectedToday && (
                    <p className="text-[11px] text-muted-foreground">{format(selectedDate, "yyyy")}</p>
                  )}
                </div>
                <button onClick={() => setSelectedDate(d => addDays(d, 1))}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {schedule.length} {schedule.length === 1 ? "block" : "blocks"}
                </span>
                <Button onClick={openAddBlock} size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 h-8">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Block
                </Button>
              </div>
            </div>

            {plannerLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : schedule.length === 0 ? (
              <div className="h-[280px] flex flex-col items-center justify-center gap-3 border border-dashed rounded-xl bg-muted/10">
                <p className="text-sm text-muted-foreground">
                  {isSelectedToday ? "Nothing planned for today." : `Nothing planned for ${format(selectedDate, "MMM d")}.`}
                </p>
                <Button onClick={openAddBlock} variant="outline" size="sm">
                  <Plus className="mr-1 h-3 w-3" /> Add first block
                </Button>
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

      {/* ══════════════════════════ TASKS TAB ══════════════════════════ */}
      {topTab === "tasks" && (
        <div className="space-y-5">
          {/* Tasks toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TaskFilters filter={filter} onFilterChange={setFilter} projects={projects} allTags={allTags} />
            <Button size="sm" onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}
              className="shrink-0">
              <Plus className="h-4 w-4 mr-2" /> New Task
            </Button>
          </div>

          {/* Task view switcher */}
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
                  taskView === id
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Task views */}
          {tasksLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-card/40">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {taskView === "list" && (
                <TaskListView tasks={tasks} subtasksMap={subtasksMap}
                  onToggleComplete={handleToggleTaskComplete} onEdit={handleEditTask} onDelete={handleDeleteTask} />
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
                <Input type="time" value={blockForm.startTime}
                  onChange={e => setBlockForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input type="time" value={blockForm.endTime}
                  onChange={e => setBlockForm(p => ({ ...p, endTime: e.target.value }))} />
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

      {/* ══ Block Delete Confirm ══ */}
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
    </div>
  );
}
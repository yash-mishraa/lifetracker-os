"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Task,
  Project,
  TaskFilter,
  TaskFormData,
  DEFAULT_TASK_FORM,
} from "@/lib/types/task";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  getSubtasks,
  createSubtask,
  getProjects,
  getAllTags,
} from "@/lib/services/task-service";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskKanbanView } from "@/components/tasks/task-kanban-view";
import { TaskTodayView } from "@/components/tasks/task-today-view";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import {
  Plus,
  List,
  Columns3,
  Sun,
  CalendarDays,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TasksPage() {
  // ── State ──────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<TaskFilter>({
    priority: "all",
    status: "all",
    project_id: "all",
    tag: "all",
    search: "",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState("list");

  // ── Data Loading ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        getTasks(filter),
        getProjects(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);

      // Load subtasks for each task
      const subMap: Record<string, Task[]> = {};
      await Promise.all(
        tasksData.map(async (t) => {
          const subs = await getSubtasks(t.id);
          if (subs.length > 0) subMap[t.id] = subs;
        })
      );
      setSubtasksMap(subMap);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleCreate = async (data: TaskFormData) => {
    await createTask(data);
    loadData();
  };

  const handleUpdate = async (data: TaskFormData) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, data);
    setEditingTask(null);
    loadData();
  };

  const handleDelete = async (task: Task) => {
    await deleteTask(task.id);
    loadData();
  };

  const handleToggleComplete = async (task: Task) => {
    await toggleTaskComplete(task);
    loadData();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    await createSubtask(parentId, title);
    loadData();
  };

  const allTags = getAllTags(tasks);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Organize and prioritize your work with smart task management.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters
        filter={filter}
        onFilterChange={setFilter}
        projects={projects}
        allTags={allTags}
      />

      {/* Tabs for Views */}
      <Tabs value={activeView} onValueChange={(val) => setActiveView(val || "list")}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-3.5 w-3.5 mr-1.5" />
            List
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <Columns3 className="h-3.5 w-3.5 mr-1.5" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="today">
            <Sun className="h-3.5 w-3.5 mr-1.5" />
            Today
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            Calendar
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-card/40">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="list">
              <TaskListView
                tasks={tasks}
                subtasksMap={subtasksMap}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="kanban">
              <TaskKanbanView
                tasks={tasks}
                subtasksMap={subtasksMap}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="today">
              <TaskTodayView
                tasks={tasks}
                subtasksMap={subtasksMap}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <TaskCalendarView tasks={tasks} onEdit={handleEdit} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        task={editingTask}
        projects={projects}
        onSubmit={editingTask ? handleUpdate : handleCreate}
      />
    </div>
  );
}

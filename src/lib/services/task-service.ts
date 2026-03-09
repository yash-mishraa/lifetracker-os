import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Task,
  Project,
  TaskFilter,
  TaskFormData,
  TaskStatus,
} from "@/lib/types/task";

// ─── Removed Local Storage Helpers ─────────────────────────────────────────────

// ─── Task Service ────────────────────────────────────────────────────────────

export async function getTasks(filter?: TaskFilter): Promise<Task[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to view tasks.");

  let query = supabase
    .from("tasks")
    .select("*, project:projects(*)")
    .is("parent_task_id", null)
    .eq('user_id', session.user.id)
    .order("position", { ascending: true });

  if (filter) {
    if (filter.priority !== "all") query = query.eq("priority", filter.priority);
    if (filter.status !== "all") query = query.eq("status", filter.status);
    if (filter.project_id !== "all") query = query.eq("project_id", filter.project_id);
    if (filter.tag !== "all") query = query.contains("tags", [filter.tag]);
    if (filter.search) query = query.ilike("title", `%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTask(id: string): Promise<Task | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to view tasks.");

  const { data, error } = await supabase
    .from("tasks")
    .select("*, project:projects(*)")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (error) return null;
  return data;
}

export async function createTask(form: TaskFormData): Promise<Task> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to create tasks.");

  const now = new Date().toISOString();
  // Math.random() is fine here because we just need to satisfy a pseudo ID if any frontend expects it locally still
  const fakeId = Math.random().toString(36).substring(2, 15);

  const newTask: Task = {
    id: fakeId,
    title: form.title,
    description: form.description,
    priority: form.priority,
    status: form.status,
    deadline: form.deadline || null,
    estimated_minutes: form.estimated_minutes,
    tags: form.tags,
    project_id: form.project_id || null,
    parent_task_id: form.parent_task_id || null,
    recurrence: form.recurrence,
    completed_at: null,
    created_at: now,
    updated_at: now,
    position: Math.floor(Date.now() / 1000), 
  };

  const { project, subtasks, id, ...insertData } = newTask;
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...insertData, user_id: session.user.id })
    .select()
    .single();
  if (error) {
    console.error("Supabase insert error details:", JSON.stringify(error, null, 2));
    throw new Error(error.message || JSON.stringify(error));
  }
  return data;
}

export async function updateTask(id: string, updates: Partial<TaskFormData & { status: TaskStatus; completed_at: string | null }>): Promise<Task> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to update tasks.");

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .update({ ...updates, updated_at: now })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();
  if (error) {
    console.error("Supabase update error details:", JSON.stringify(error, null, 2));
    throw new Error(error.message || JSON.stringify(error));
  }
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to delete tasks.");

  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", session.user.id);
  if (error) throw error;
}

export async function toggleTaskComplete(task: Task): Promise<Task> {
  const isCompleting = task.status !== "completed";
  return updateTask(task.id, {
    status: isCompleting ? "completed" : "todo",
    completed_at: isCompleting ? new Date().toISOString() : null,
  });
}

// ─── Subtasks ────────────────────────────────────────────────────────────────

export async function getSubtasks(parentId: string): Promise<Task[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to view subtasks.");

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("parent_task_id", parentId)
    .eq("user_id", session.user.id)
    .order("position", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createSubtask(parentId: string, title: string): Promise<Task> {
  return createTask({
    title,
    description: "",
    priority: "medium",
    status: "todo",
    deadline: "",
    estimated_minutes: 0,
    tags: [],
    project_id: "",
    parent_task_id: parentId,
    recurrence: "none",
  });
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to view projects.");

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", session.user.id)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createProject(name: string, color: string): Promise<Project> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("User must be logged in to view projects.");

  const project: Omit<Project, 'id'> = {
    name,
    color,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...project, user_id: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Removed Local Filter ────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getAllTags(tasks: Task[]): string[] {
  const tagSet = new Set<string>();
  tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

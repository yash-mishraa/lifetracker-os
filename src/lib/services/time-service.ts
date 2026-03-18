import { supabase, isSupabaseConfigured } from '../supabase';
import { TimeLog, TimeLogFormData, ProjectTimeStats } from '../types/time';
import { Task } from '../types/task';
import { startOfDay, startOfWeek, endOfDay, endOfWeek } from 'date-fns';

// ── User-scoped localStorage key ─────────────────────────────────────────────
async function getStorageKey(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? "anonymous";
    return `lifeos_time_logs_${uid}`;
  } catch {
    return "lifeos_time_logs_anonymous";
  }
}

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15);
}

export async function getTimeLogs(startDate?: Date, endDate?: Date): Promise<TimeLog[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error("Not authenticated");

    let query = supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', session.user.id);

    if (startDate) query = query.gte('start_time', startDate.toISOString());
    if (endDate) query = query.lte('end_time', endDate.toISOString());

    const { data, error } = await query.order('start_time', { ascending: false });
    if (error) throw new Error(error.message);
    return data as TimeLog[];
  }

  // Local storage fallback — user-scoped key
  try {
    const key = await getStorageKey();
    const raw = localStorage.getItem(key);
    let logs: TimeLog[] = raw ? JSON.parse(raw) : [];
    if (startDate || endDate) {
      logs = logs.filter(log => {
        const t = new Date(log.start_time).getTime();
        return t >= (startDate?.getTime() ?? 0) && t <= (endDate?.getTime() ?? Infinity);
      });
    }
    return logs.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  } catch {
    return [];
  }
}

export async function saveTimeLog(formData: TimeLogFormData): Promise<TimeLog> {
  const model: Partial<TimeLog> = {
    task_id: formData.task_id || null,
    start_time: formData.start_time.toISOString(),
    end_time: formData.end_time.toISOString(),
    duration_seconds: formData.duration_seconds,
    timer_type: formData.timer_type,
  };

  if (isSupabaseConfigured() && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from('time_logs')
      .insert([{ ...model, user_id: user.id }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as TimeLog;
  }

  const newLog: TimeLog = { id: generateId(), ...model, created_at: new Date().toISOString() } as TimeLog;
  const key = await getStorageKey();
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  localStorage.setItem(key, JSON.stringify([newLog, ...existing]));
  return newLog;
}

export async function deleteTimeLog(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error("Not authenticated");
    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    if (error) throw new Error(error.message);
    return;
  }
  const key = await getStorageKey();
  const existing: TimeLog[] = JSON.parse(localStorage.getItem(key) || '[]');
  localStorage.setItem(key, JSON.stringify(existing.filter(i => i.id !== id)));
}

export async function getTodayFocusTime(): Promise<number> {
  const today = new Date();
  const logs = await getTimeLogs(startOfDay(today), endOfDay(today));
  return logs.reduce((t, l) => t + l.duration_seconds, 0);
}

export async function getWeekFocusTime(): Promise<number> {
  const today = new Date();
  const logs = await getTimeLogs(
    startOfWeek(today, { weekStartsOn: 1 }),
    endOfWeek(today, { weekStartsOn: 1 })
  );
  return logs.reduce((t, l) => t + l.duration_seconds, 0);
}

export async function getProjectFocusTime(tasks: Task[], startDate?: Date, endDate?: Date): Promise<ProjectTimeStats[]> {
  const logs = await getTimeLogs(startDate, endDate);
  const taskToProjectMap = new Map<string, string>();
  tasks.forEach(t => { if (t.project) taskToProjectMap.set(t.id, t.project.name); });

  const projectTotals = new Map<string, number>();
  let unassignedTotal = 0;

  logs.forEach(log => {
    if (log.task_id && taskToProjectMap.has(log.task_id)) {
      const proj = taskToProjectMap.get(log.task_id)!;
      projectTotals.set(proj, (projectTotals.get(proj) || 0) + log.duration_seconds);
    } else {
      unassignedTotal += log.duration_seconds;
    }
  });

  const stats: ProjectTimeStats[] = Array.from(projectTotals.entries()).map(([name, seconds]) => ({
    project_id: name, project_name: name, total_seconds: seconds
  }));
  if (unassignedTotal > 0) stats.push({ project_id: 'unassigned', project_name: 'No Project', total_seconds: unassignedTotal });
  return stats.sort((a, b) => b.total_seconds - a.total_seconds);
}
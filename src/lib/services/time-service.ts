import { supabase, isSupabaseConfigured } from '../supabase';
import { TimeLog, TimeLogFormData, ProjectTimeStats } from '../types/time';
import { Task } from '../types';
import { startOfDay, startOfWeek, endOfDay, endOfWeek, parseISO } from 'date-fns';

const TIME_LOGS_STORAGE_KEY = 'lifeos_time_logs';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function getTimeLogs(startDate?: Date, endDate?: Date): Promise<TimeLog[]> {
  if (isSupabaseConfigured() && supabase) {
    let query = supabase.from('time_logs').select('*');
    
    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('end_time', endDate.toISOString());
    }
    
    const { data, error } = await query.order('start_time', { ascending: false });
    
    if (error) {
      console.error("Supabase getTimeLogs error:", error);
      throw new Error(error.message);
    }
    return data as TimeLog[];
  }

  // --- LOCAL STORAGE FALLBACK ---
  try {
    const raw = localStorage.getItem(TIME_LOGS_STORAGE_KEY);
    let logs: TimeLog[] = raw ? JSON.parse(raw) : [];
    
    if (startDate || endDate) {
      logs = logs.filter(log => {
        const logStart = new Date(log.start_time).getTime();
        const start = startDate ? startDate.getTime() : 0;
        const end = endDate ? endDate.getTime() : Infinity;
        return logStart >= start && logStart <= end;
      });
    }
    
    return logs.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  } catch (error) {
    console.error("Local storage error:", error);
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
    const { data, error } = await supabase
      .from('time_logs')
      .insert([model])
      .select()
      .single();
      
    if (error) {
      console.error("Supabase saveTimeLog error:", error);
      throw new Error(error.message);
    }
    return data as TimeLog;
  }

  // --- LOCAL STORAGE FALLBACK ---
  const newLog: TimeLog = {
    id: generateId(),
    ...model,
    created_at: new Date().toISOString()
  } as TimeLog;
  
  const existingRaw = localStorage.getItem(TIME_LOGS_STORAGE_KEY);
  const existing = existingRaw ? JSON.parse(existingRaw) : [];
  localStorage.setItem(TIME_LOGS_STORAGE_KEY, JSON.stringify([newLog, ...existing]));
  
  return newLog;
}

export async function deleteTimeLog(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error("Supabase deleteTimeLog error:", error);
      throw new Error(error.message);
    }
    return;
  }

  // --- LOCAL STORAGE FALLBACK ---
  const existingRaw = localStorage.getItem(TIME_LOGS_STORAGE_KEY);
  if (existingRaw) {
    const existing: TimeLog[] = JSON.parse(existingRaw);
    localStorage.setItem(TIME_LOGS_STORAGE_KEY, JSON.stringify(existing.filter(i => i.id !== id)));
  }
}

// ---------------------------------------------------------------------------
// AGGREGATIONS
// ---------------------------------------------------------------------------

export async function getTodayFocusTime(): Promise<number> {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);
  
  const logs = await getTimeLogs(start, end);
  return logs.reduce((total, log) => total + log.duration_seconds, 0);
}

export async function getWeekFocusTime(): Promise<number> {
  const today = new Date();
  // Monday as start of week (1)
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const end = endOfWeek(today, { weekStartsOn: 1 });
  
  const logs = await getTimeLogs(start, end);
  return logs.reduce((total, log) => total + log.duration_seconds, 0);
}

/**
 * Returns focus time grouped by project for the given date range (or all time if not provided).
 * Requires fetching tasks to map task_id -> project.
 */
export async function getProjectFocusTime(tasks: Task[], startDate?: Date, endDate?: Date): Promise<ProjectTimeStats[]> {
  const logs = await getTimeLogs(startDate, endDate);
  
  // Map task_id to project
  const taskToProjectMap = new Map<string, string>();
  tasks.forEach(t => {
    if (t.project) {
      taskToProjectMap.set(t.id, t.project);
    }
  });

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
    project_id: name,
    project_name: name,
    total_seconds: seconds
  }));

  if (unassignedTotal > 0) {
    stats.push({
      project_id: 'unassigned',
      project_name: 'No Project',
      total_seconds: unassignedTotal
    });
  }

  // Sort by highest time
  return stats.sort((a, b) => b.total_seconds - a.total_seconds);
}

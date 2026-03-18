"use client";

import { useState, useEffect } from "react";
import {
  Task, TaskFormData, Project, DEFAULT_TASK_FORM,
  PRIORITY_CONFIG, STATUS_CONFIG, RECURRENCE_OPTIONS,
  Priority, TaskStatus, Recurrence,
} from "@/lib/types/task";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projects: Project[];
  onSubmit: (data: TaskFormData) => void;
  /** The date context for the planner — deadline will be set to this date + startTime */
  forDate?: Date;
}

export function TaskDialog({ open, onOpenChange, task, projects, onSubmit, forDate }: TaskDialogProps) {
  const [form, setForm] = useState<TaskFormData>(DEFAULT_TASK_FORM);
  const [tagInput, setTagInput] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
        estimated_minutes: task.estimated_minutes,
        tags: task.tags,
        project_id: task.project_id || "",
        parent_task_id: task.parent_task_id || "",
        recurrence: task.recurrence,
      });
      if (task.deadline) {
        const d = new Date(task.deadline);
        setStartTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
        const endMins = d.getHours() * 60 + d.getMinutes() + (task.estimated_minutes || 60);
        setEndTime(`${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`);
      } else {
        setStartTime("09:00");
        setEndTime("10:00");
      }
    } else {
      setForm(DEFAULT_TASK_FORM);
      setStartTime("09:00");
      setEndTime("10:00");
    }
    setTagInput("");
  }, [task, open]);

  // Auto-calc estimated_minutes from start/end
  useEffect(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) setForm(f => ({ ...f, estimated_minutes: diff }));
  }, [startTime, endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    // Use forDate if provided (planner context), otherwise use today
    const baseDate = forDate ? new Date(forDate) : new Date();
    const [sh, sm] = startTime.split(":").map(Number);
    baseDate.setHours(sh, sm, 0, 0);

    const finalForm: TaskFormData = {
      ...form,
      deadline: baseDate.toISOString().slice(0, 16),
    };
    onSubmit(finalForm);
    onOpenChange(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  const handleTagKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the task details below." : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title *</Label>
            <Input id="task-title" placeholder="What needs to be done?"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea id="task-desc" placeholder="Add details..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={val => setForm({ ...form, priority: (val as Priority) || "medium" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${PRIORITY_CONFIG[p].dotColor}`} />
                        {PRIORITY_CONFIG[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={val => setForm({ ...form, status: (val as TaskStatus) || "todo" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-time">Start Time</Label>
              <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-time">End Time</Label>
              <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          {form.estimated_minutes > 0 && (
            <p className="text-[11px] text-muted-foreground -mt-2">Duration: {form.estimated_minutes} min</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select
                value={(form.project_id ?? "") || "none"}
                onValueChange={val => setForm({ ...form, project_id: val === "none" ? "" : (val ?? "") })}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="No Project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {(projects || []).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Recurrence</Label>
              <Select value={form.recurrence} onValueChange={val => setForm({ ...form, recurrence: (val as Recurrence) || "none" })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input placeholder="Add tag and press Enter" value={tagInput}
                onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {form.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs gap-1 pl-2 pr-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-foreground ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit">{isEditing ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
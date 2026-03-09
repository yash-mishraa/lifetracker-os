"use client";

import { useState, useEffect } from "react";
import {
  Habit,
  HabitFormData,
  HabitType,
  HabitFrequency,
  HabitCategory,
  HABIT_CATEGORIES,
  DEFAULT_HABIT_FORM,
} from "@/lib/types/habit";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
  onSubmit: (data: HabitFormData) => void;
}

export function HabitDialog({
  open,
  onOpenChange,
  habit,
  onSubmit,
}: HabitDialogProps) {
  const [form, setForm] = useState<HabitFormData>(DEFAULT_HABIT_FORM);
  const isEditing = !!habit;

  useEffect(() => {
    if (habit) {
      setForm({
        name: habit.name,
        type: habit.type,
        category: habit.category,
        frequency_type: habit.frequency_type,
        frequency_days: habit.frequency_days || [],
        reminder_time: habit.reminder_time || "",
        target_value: habit.target_value,
        notes: habit.notes || "",
        color: habit.color,
      });
    } else {
      setForm(DEFAULT_HABIT_FORM);
    }
  }, [habit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    // Cleanup based on type
    const submitData = { ...form };
    if (submitData.type === "binary") {
      submitData.target_value = 1; // Enforce 1 for binary
    }
    
    if (submitData.frequency_type === "daily") {
      submitData.frequency_days = [];
    }

    onSubmit(submitData);
    onOpenChange(false);
  };

  const toggleFrequencyDay = (dayIndex: number) => {
    if (form.frequency_type === "custom") return; // not used for custom
    const set = new Set(form.frequency_days);
    if (set.has(dayIndex)) set.delete(dayIndex);
    else set.add(dayIndex);
    setForm({ ...form, frequency_days: Array.from(set).sort() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Habit" : "New Habit"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your habit details." : "Define a new habit to track."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="habit-name">Name *</Label>
            <Input
              id="habit-name"
              placeholder="e.g. Read 10 pages, Drink water..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm({ ...form, type: (val as HabitType) || "binary" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="binary">Binary (Yes/No)</SelectItem>
                  <SelectItem value="quantitative">Quantitative (Number)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm({ ...form, category: val || HABIT_CATEGORIES[0] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type === "quantitative" && (
            <div className="space-y-1.5">
              <Label htmlFor="habit-target">Daily Target Value</Label>
              <Input
                id="habit-target"
                type="number"
                min={1}
                value={form.target_value || ""}
                onChange={(e) => setForm({ ...form, target_value: parseInt(e.target.value) || 1 })}
                required
              />
              <p className="text-xs text-muted-foreground">What number are you trying to hit each day?</p>
            </div>
          )}

          <div className="space-y-3 border rounded-md p-4 bg-muted/30">
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select
                value={form.frequency_type}
                onValueChange={(val) => setForm({ ...form, frequency_type: (val as HabitFrequency) || "daily" })}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every Day</SelectItem>
                  <SelectItem value="weekdays">Specific Days</SelectItem>
                  <SelectItem value="custom">X Times Per Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.frequency_type === "weekdays" && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Select Days</Label>
                <div className="flex gap-1 flex-wrap">
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <Badge
                      key={day}
                      variant="outline"
                      className={`cursor-pointer ${form.frequency_days.includes(idx) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                      onClick={() => toggleFrequencyDay(idx)}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {form.frequency_type === "custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="habit-custom-freq" className="text-xs text-muted-foreground">Times per week</Label>
                <Input
                  id="habit-custom-freq"
                  type="number"
                  min={1}
                  max={7}
                  value={form.frequency_days[0] || ""}
                  onChange={(e) => setForm({ ...form, frequency_days: [parseInt(e.target.value) || 1] })}
                  className="bg-background"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="habit-reminder">Reminder Time (Optional)</Label>
              <Input
                id="habit-reminder"
                type="time"
                value={form.reminder_time}
                onChange={(e) => setForm({ ...form, reminder_time: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 items-center h-10">
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground uppercase">{form.color}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="habit-notes">Notes</Label>
            <Textarea
              id="habit-notes"
              placeholder="Why are you building this habit?"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit">
              {isEditing ? "Save Changes" : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

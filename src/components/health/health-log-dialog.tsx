"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { HealthLog, HealthFormData, MOOD_OPTIONS, DEFAULT_HEALTH_FORM } from "@/lib/types/health";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Moon, Droplets, Dumbbell, Apple, Activity, HeartPulse } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface HealthLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log?: HealthLog | null; // Pass existing log if editing
  defaultDate?: string;   // Pass a specific date string (YYYY-MM-DD) if logging a specific day
  onSubmit: (data: HealthFormData) => void;
}

export function HealthLogDialog({
  open,
  onOpenChange,
  log,
  defaultDate,
  onSubmit,
}: HealthLogDialogProps) {
  const [form, setForm] = useState<HealthFormData>(DEFAULT_HEALTH_FORM);
  const [dateObj, setDateObj] = useState<Date>(new Date());

  useEffect(() => {
    if (open) {
      if (log) {
        setForm({
          date: log.date,
          sleep_hours: log.sleep_hours,
          water_intake: log.water_intake,
          weight: log.weight ?? "",
          steps: log.steps,
          calories: log.calories,
          workout_done: log.workout_done,
          workout_details: log.workout_details || "",
          mood: log.mood || "",
          notes: log.notes || "",
        });
        setDateObj(parseISO(log.date));
      } else {
        const dStr = defaultDate || new Date().toISOString().split("T")[0];
        setForm({ ...DEFAULT_HEALTH_FORM, date: dStr });
        setDateObj(parseISO(dStr));
      }
    }
  }, [log, defaultDate, open]);

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) return;
    setDateObj(d);
    setForm({ ...form, date: format(d, "yyyy-MM-dd") });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{log ? "Edit Health Log" : "Daily Health Log"}</DialogTitle>
          <DialogDescription>
            {log ? "Update your metrics." : "Record your metrics for the day."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          
          {/* Date Picker (in case they want to backfill within the dialog) */}
          <div className="space-y-1.5 flex flex-col">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger>
                <div className={`flex w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${!form.date && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateObj ? format(dateObj, "PPP") : "Pick a date"}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateObj} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sleep */}
            <div className="space-y-1.5 p-3 border rounded-lg bg-indigo-500/5">
              <Label htmlFor="sleep" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Moon className="h-4 w-4" /> Sleep (Hours)
              </Label>
              <Input
                id="sleep"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={form.sleep_hours || ""}
                onChange={(e) => setForm({ ...form, sleep_hours: parseFloat(e.target.value) || 0 })}
                className="bg-background"
                placeholder="e.g. 7.5"
              />
            </div>

            {/* Water */}
            <div className="space-y-1.5 p-3 border rounded-lg bg-blue-500/5">
              <Label htmlFor="water" className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Droplets className="h-4 w-4" /> Water (Glasses/Liters)
              </Label>
              <Input
                id="water"
                type="number"
                min="0"
                value={form.water_intake || ""}
                onChange={(e) => setForm({ ...form, water_intake: parseInt(e.target.value) || 0 })}
                className="bg-background"
                placeholder="e.g. 8"
              />
            </div>

            {/* Steps */}
            <div className="space-y-1.5 p-3 border rounded-lg bg-emerald-500/5">
              <Label htmlFor="steps" className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-4 w-4" /> Steps
              </Label>
              <Input
                id="steps"
                type="number"
                min="0"
                value={form.steps || ""}
                onChange={(e) => setForm({ ...form, steps: parseInt(e.target.value) || 0 })}
                className="bg-background"
                placeholder="e.g. 10000"
              />
            </div>

            {/* Calories */}
            <div className="space-y-1.5 p-3 border rounded-lg bg-orange-500/5">
              <Label htmlFor="calories" className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Apple className="h-4 w-4" /> Calories (kcal)
              </Label>
              <Input
                id="calories"
                type="number"
                min="0"
                value={form.calories || ""}
                onChange={(e) => setForm({ ...form, calories: parseInt(e.target.value) || 0 })}
                className="bg-background"
                placeholder="e.g. 2500"
              />
            </div>
            
            {/* Weight */}
            <div className="space-y-1.5 p-3 border rounded-lg col-span-2 sm:col-span-1">
              <Label htmlFor="weight" className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4" /> Weight (kg/lbs)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={form.weight?.toString() || ""}
                onChange={(e) => setForm({ ...form, weight: e.target.value ? parseFloat(e.target.value) : "" })}
                className="bg-background"
                placeholder="e.g. 70.5"
              />
            </div>
            
            {/* Mood Dropdown */}
            <div className="space-y-1.5 p-3 border rounded-lg bg-pink-500/5 col-span-2 sm:col-span-1">
              <Label className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                Mood
              </Label>
              <Select
                value={form.mood || ""}
                onValueChange={(val: string | null) => {
                  if (val) setForm({ ...form, mood: val === "none" ? "" : val })
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="How do you feel?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Skip --</SelectItem>
                  {MOOD_OPTIONS.map((mood) => (
                    <SelectItem key={mood} value={mood}>
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2 text-base">
                  <Dumbbell className="h-4 w-4" /> Workout Completed?
                </Label>
                <p className="text-xs text-muted-foreground">Did you exercise today?</p>
              </div>
              <Switch
                checked={form.workout_done}
                onCheckedChange={(checked: boolean) => setForm({ ...form, workout_done: checked })}
              />
            </div>

            {form.workout_done && (
              <div className="space-y-1.5 pt-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="workout_details">Workout Details</Label>
                <Input
                  id="workout_details"
                  placeholder="e.g. 45 min Weightlifting, 5k Run..."
                  value={form.workout_details}
                  onChange={(e) => setForm({ ...form, workout_details: e.target.value })}
                  className="bg-background"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Daily Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any general thoughts, symptoms, or highlights for the day?"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              {log ? "Save Updates" : "Save Health Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Goal, GoalFormData, GoalCategory } from "@/lib/types/goal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSubmit: (formData: GoalFormData) => Promise<void>;
}

const CATEGORIES: GoalCategory[] = ['Career', 'Health', 'Learning', 'Finance', 'Personal'];

export function GoalDialog({ open, onOpenChange, goal, onSubmit }: GoalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<GoalFormData>({
    title: "",
    description: "",
    category: "Personal",
    target_date: undefined,
  });

  useEffect(() => {
    if (open) {
      if (goal) {
        setForm({
          title: goal.title,
          description: goal.description || "",
          category: goal.category,
          target_date: goal.target_date ? parseISO(goal.target_date) : undefined,
        });
      } else {
        setForm({
          title: "",
          description: "",
          category: "Personal",
          target_date: undefined,
        });
      }
    }
  }, [open, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit Goal" : "Create New Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Run a Marathon"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is your motivation?..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(val) => setForm({ ...form, category: val as GoalCategory })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label>Target Date</Label>
            <Popover>
              <PopoverTrigger>
                <div className={`flex w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${!form.target_date && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.target_date ? format(form.target_date, "PPP") : "Pick a target date"}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                  mode="single" 
                  selected={form.target_date} 
                  onSelect={(date) => setForm({ ...form, target_date: date })}
                  initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.title.trim()}>
              {loading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

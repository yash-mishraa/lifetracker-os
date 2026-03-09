"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Milestone, MilestoneFormData } from "@/lib/types/goal";

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: Milestone | null;
  onSubmit: (formData: MilestoneFormData) => Promise<void>;
}

export function MilestoneDialog({ open, onOpenChange, milestone, onSubmit }: MilestoneDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<MilestoneFormData>({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (open) {
      if (milestone) {
        setForm({
          title: milestone.title,
          description: milestone.description || "",
        });
      } else {
        setForm({
          title: "",
          description: "",
        });
      }
    }
  }, [open, milestone]);

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
          <DialogTitle>{milestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Milestone Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Complete Week 1 Training"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details (Optional)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Specific run distances..."
              rows={3}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.title.trim()}>
              {loading ? "Saving..." : milestone ? "Update Milestone" : "Add Milestone"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

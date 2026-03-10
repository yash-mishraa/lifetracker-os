//health-goals-dialog
"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertHealthGoals } from "@/lib/services/health-service";
import { useToast } from "@/components/ui/use-toast";

interface HealthGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoals: { sleep_hours_goal: number; water_intake_goal: number; steps_goal: number };
  onSaved: (goals: any) => void;
}

export function HealthGoalsDialog({ open, onOpenChange, currentGoals, onSaved }: HealthGoalsDialogProps) {
  const [goals, setGoals] = useState(currentGoals);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await upsertHealthGoals(goals);
      onSaved(saved);
      toast({ title: "Goals saved!" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to save goals", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Your Health Goals</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Sleep Goal (hours)</Label>
            <Input type="number" value={goals.sleep_hours_goal} 
              onChange={e => setGoals(g => ({ ...g, sleep_hours_goal: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1">
            <Label>Water Goal (litres)</Label>
            <Input type="number" step="0.1" value={goals.water_intake_goal}
              onChange={e => setGoals(g => ({ ...g, water_intake_goal: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1">
            <Label>Steps Goal</Label>
            <Input type="number" value={goals.steps_goal}
              onChange={e => setGoals(g => ({ ...g, steps_goal: Number(e.target.value) }))} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Goals"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
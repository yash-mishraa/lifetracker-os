"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoutineFormData, RoutineType, DEFAULT_ROUTINE_FORM } from "@/lib/types/routine";
import { createRoutine, createRoutineStep } from "@/lib/services/routine-service";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, X } from "lucide-react";

interface RoutineManagerDialogProps {
  children?: React.ReactNode;
  onSaved: () => void;
}

export function RoutineManagerDialog({ children, onSaved }: RoutineManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<RoutineFormData>(DEFAULT_ROUTINE_FORM);
  const [steps, setSteps] = useState<string[]>([""]); // Array of step titles
  const { toast } = useToast();

  function resetForm() {
    setForm(DEFAULT_ROUTINE_FORM);
    setSteps([""]);
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) resetForm();
    setOpen(newOpen);
  }

  function handleStepChange(index: number, value: string) {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  }

  function addStep() {
    setSteps([...steps, ""]);
  }

  function removeStep(index: number) {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    
    console.log("Saving routine:", form, steps);
    
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    const validSteps = steps.filter(s => s.trim() !== "");
    if (validSteps.length === 0) {
      toast({ title: "At least one step is required", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Force a timeout so it never hangs indefinitely
      await Promise.race([
        (async () => {
          // 1. Create the Routine
          const routine = await createRoutine(form);
          // 2. Create the attached steps
          for (const stepTitle of validSteps) {
            await createRoutineStep(routine.id, stepTitle.trim());
          }
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Network timeout: Supabase took too long to respond or authorization hung.")), 8000))
      ]);

      toast({ title: "Routine created successfully!" });
      setOpen(false);
      onSaved();
    } catch (err: any) {
      console.error("Routine Save Error:", err);
      alert(`Save Error: ${err.message}`);
      toast({ title: "Failed to save routine", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger 
        render={children ? (children as React.ReactElement) : <Button>Create Routine</Button>} 
      />
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Routine</DialogTitle>
          <DialogDescription>
            Define a routine and list exactly what you want to check off each time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Routine Name</Label>
              <Input
                id="title"
                placeholder="e.g. Morning Reset"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Routine Type</Label>
              <Select 
                value={form.type} 
                onValueChange={(val) => setForm({ ...form, type: val as RoutineType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning Routine</SelectItem>
                  <SelectItem value="night">Night Routine</SelectItem>
                  <SelectItem value="other">Other / General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 border-t pt-4">
              <Label>Steps</Label>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="bg-muted text-muted-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <Input 
                      placeholder="e.g. Drink water"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      className="h-9"
                    />
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeStep(index)}
                      disabled={steps.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="w-full mt-2 border-dashed" onClick={addStep}>
                <Plus className="h-4 w-4 mr-2" /> Add Step
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Routine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setOnboardingCompleted } from "@/lib/services/onboarding-service";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// We will build distinct components for each step later, keeping them stubbed here for now.
import { Step1Goals } from "@/components/onboarding/step1-goals";
import { Step2Habits } from "@/components/onboarding/step2-habits";
import { Step3Tasks } from "@/components/onboarding/step3-tasks";
import { Step4Focus } from "@/components/onboarding/step4-focus";
import { Step5Reminders } from "@/components/onboarding/step5-reminders";
import { createGoal } from "@/lib/services/goal-service";
import { createHabit } from "@/lib/services/habit-service";
import { createTask } from "@/lib/services/task-service";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cross-step data we might collect
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [focusHours, setFocusHours] = useState(2);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (!user) throw new Error("Not authenticated");
      setIsSubmitting(true);
      
      // 1. Create Goals
      for (const goalTitle of selectedGoals) {
        await createGoal({
          title: goalTitle,
          description: "Created during onboarding",
          category: "Personal",
          target_date: undefined
        });
      }

      // 2. Create Habits
      for (const habitTitle of selectedHabits) {
        await createHabit({
          name: habitTitle,
          notes: "Created during onboarding",
          type: "binary",
          category: "Productivity",
          color: "#6366f1",
          frequency_type: "daily",
          frequency_days: [],
          target_value: 1,
          reminder_time: ""
        } as any);
      }

      // 3. Create Tasks
      for (const taskTitle of tasks) {
        await createTask({
          title: taskTitle,
          description: "",
          priority: "medium",
          status: "todo",
          estimated_minutes: 30,
          tags: ["Onboarding"],
          project_id: "",
          parent_task_id: "",
          recurrence: "none",
          deadline: ""
        });
      }

      // 4 & 5. Save Settings (Focus & Reminders)
      if (typeof window !== "undefined") {
        localStorage.setItem("lifeos_focus_target", focusHours.toString());
        localStorage.setItem("lifeos_reminders_enabled", remindersEnabled.toString());
      }

      setOnboardingCompleted(user.id);
      toast({ title: "Setup Complete!", description: "Welcome to LifeOS Tracker." });
      
      setTimeout(() => {
        router.replace("/dashboard");
      }, 500);
    } catch (err: any) {
      toast({ title: "Error during setup", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (!user) return;
    setOnboardingCompleted(user.id);
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to LifeOS</h1>
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Skip setup
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500 ease-in-out" 
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>Step {currentStep} of {TOTAL_STEPS}</span>
            <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}% Completed</span>
          </div>
        </div>

        <Card className="min-h-[400px] flex flex-col shadow-lg border-primary/10">
          <div className="flex-1 p-6 relative">
            {currentStep === 1 && <Step1Goals selected={selectedGoals} onChange={setSelectedGoals} />}
            {currentStep === 2 && <Step2Habits selected={selectedHabits} onChange={setSelectedHabits} />}
            {currentStep === 3 && <Step3Tasks tasks={tasks} onChange={setTasks} />}
            {currentStep === 4 && <Step4Focus hours={focusHours} onChange={setFocusHours} />}
            {currentStep === 5 && <Step5Reminders enabled={remindersEnabled} onChange={setRemindersEnabled} />}
          </div>
          
          <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
            <Button 
              variant="outline" 
              onClick={handleBack} 
              disabled={currentStep === 1 || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button onClick={handleNext}>
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? "Finishing..." : "Complete Setup"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { setOnboardingCompleted } from "@/lib/services/onboarding-service";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Step1Goals } from "@/components/onboarding/step1-goals";
import { Step2Habits } from "@/components/onboarding/step2-habits";
import { Step3Tasks } from "@/components/onboarding/step3-tasks";
import { Step4Focus } from "@/components/onboarding/step4-focus";
import { Step5Reminders } from "@/components/onboarding/step5-reminders";
import { createGoal } from "@/lib/services/goal-service";
import { createHabit } from "@/lib/services/habit-service";
import { createTask } from "@/lib/services/task-service";

const TOTAL_STEPS = 5;
const ease = [0.22, 1, 0.36, 1] as const;

const STEP_META = [
  { label: "Goals",     hint: "What matters most to you" },
  { label: "Habits",    hint: "Daily routines to build" },
  { label: "Tasks",     hint: "What's on your agenda" },
  { label: "Focus",     hint: "How deep you want to go" },
  { label: "Reminders", hint: "Stay on track" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [tasks, setTasks] = useState<string[]>([]);
  const [focusHours, setFocusHours] = useState(2);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const goNext = () => { setDirection(1); setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS)); };
  const goBack = () => { setDirection(-1); setCurrentStep(s => Math.max(s - 1, 1)); };

  const handleSkip = () => {
    if (!user) return;
    setOnboardingCompleted(user.id);
    router.replace("/dashboard");
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      for (const t of selectedGoals) await createGoal({ title:t, description:"", category:"Personal", target_date:undefined });
      for (const h of selectedHabits) await createHabit({ name:h, notes:"", type:"binary", category:"Productivity", color:"#6366f1", frequency_type:"daily", frequency_days:[], target_value:1, reminder_time:"" } as any);
      for (const t of tasks) await createTask({ title:t, description:"", priority:"medium", status:"todo", estimated_minutes:30, tags:["Onboarding"], project_id:"", parent_task_id:"", recurrence:"none", deadline:"" });
      if (typeof window !== "undefined") {
        localStorage.setItem("lifeos_focus_target", focusHours.toString());
        localStorage.setItem("lifeos_reminders_enabled", remindersEnabled.toString());
      }
      setOnboardingCompleted(user.id);
      setDone(true);
      setTimeout(() => router.replace("/dashboard"), 1800);
    } catch (err: any) {
      toast({ title:"Error", description: err.message, variant:"destructive" });
    } finally { setIsSubmitting(false); }
  };

  const pct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  if (done) return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center">
      <motion.div
        initial={{ opacity:0, scale:0.9 }}
        animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.5, ease }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ scale:0 }} animate={{ scale:1 }}
          transition={{ type:"spring", stiffness:300, damping:20, delay:0.1 }}
          className="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.2)]"
        >
          <Check className="h-8 w-8 text-black" />
        </motion.div>
        <p className="text-white/60 text-sm">Taking you to your dashboard…</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#060606] text-white flex flex-col">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/6 rounded-full blur-[120px]" />
      </div>

      {/* ── Header ── */}
      <motion.header
        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease }}
        className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/[0.04]"
      >
        <div>
          <div className="flex items-baseline gap-[3px]">
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white/90">Life</span>
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-white/30">OS</span>
          </div>
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/20 mt-[1px]">Tracker</p>
        </div>
        <button onClick={handleSkip} className="text-[12px] text-white/20 hover:text-white/40 transition-colors">
          Skip setup
        </button>
      </motion.header>

      {/* ── Progress ── */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ duration:0.5, ease, delay:0.1 }}
        className="relative z-10 px-8 pt-8"
      >
        <div className="max-w-2xl mx-auto">
          {/* Step dots */}
          <div className="flex items-center gap-0 mb-6">
            {STEP_META.map((s, i) => {
              const n = i + 1;
              const isActive = n === currentStep;
              const isDone = n < currentStep;
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      animate={{
                        backgroundColor: isDone ? "#ffffff" : isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)",
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration:0.3 }}
                      className="h-6 w-6 rounded-full flex items-center justify-center"
                    >
                      {isDone
                        ? <Check className="h-3 w-3 text-black" />
                        : <span className={`text-[10px] font-medium ${isActive?"text-black":"text-white/30"}`}>{n}</span>
                      }
                    </motion.div>
                    <span className={`text-[9px] tracking-wide hidden sm:block transition-colors ${isActive?"text-white/60":"text-white/20"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < TOTAL_STEPS - 1 && (
                    <div className="flex-1 mx-2 h-px bg-white/[0.06] relative overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-white/30"
                        animate={{ width: isDone ? "100%" : "0%" }}
                        transition={{ duration:0.4, ease }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Step content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 py-6">
        <div className="w-full max-w-2xl flex-1 flex flex-col">

          {/* Step header */}
          <AnimatePresence mode="wait">
            <motion.div key={`header-${currentStep}`}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.3, ease }}
              className="mb-6"
            >
              <p className="text-[11px] tracking-[0.12em] uppercase text-white/25 mb-1">
                Step {currentStep} of {TOTAL_STEPS} · {STEP_META[currentStep-1].hint}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Step body */}
          <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 md:p-8 overflow-hidden relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                initial={{ opacity:0, x: direction * 30, filter:"blur(6px)" }}
                animate={{ opacity:1, x:0, filter:"blur(0px)" }}
                exit={{ opacity:0, x: direction * -30, filter:"blur(6px)" }}
                transition={{ duration:0.35, ease }}
                className="h-full"
              >
                {currentStep===1 && <Step1Goals selected={selectedGoals} onChange={setSelectedGoals} />}
                {currentStep===2 && <Step2Habits selected={selectedHabits} onChange={setSelectedHabits} />}
                {currentStep===3 && <Step3Tasks tasks={tasks} onChange={setTasks} />}
                {currentStep===4 && <Step4Focus hours={focusHours} onChange={setFocusHours} />}
                {currentStep===5 && <Step5Reminders enabled={remindersEnabled} onChange={setRemindersEnabled} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <motion.div
            initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4, ease, delay:0.2 }}
            className="flex items-center justify-between mt-5"
          >
            <button onClick={goBack} disabled={currentStep===1}
              className="flex items-center gap-1.5 text-[13px] text-white/25 hover:text-white/50 disabled:opacity-0 transition-all">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            <div className="flex items-center gap-2">
              {/* Mini progress dots */}
              {Array.from({length: TOTAL_STEPS}).map((_,i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i+1===currentStep?"w-5 bg-white/70":"w-1.5 bg-white/15"}`} />
              ))}
            </div>

            {currentStep < TOTAL_STEPS ? (
              <button onClick={goNext}
                className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white/90 transition-colors">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button onClick={handleComplete} disabled={isSubmitting}
                className="flex items-center gap-1.5 bg-white text-black text-[13px] font-medium px-5 py-2 rounded-full hover:bg-white/90 transition-all disabled:opacity-50">
                {isSubmitting ? "Setting up…" : "Finish setup"}
                {!isSubmitting && <Check className="h-3.5 w-3.5" />}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
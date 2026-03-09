"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTasks } from "@/lib/services/task-service";
import { saveTimeLog } from "@/lib/services/time-service";
import { Task } from "@/lib/types/task";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Play, Pause, Square, X, RefreshCcw } from "lucide-react";

const MOTIVATIONAL_QUOTES = [
  "Focus is the art of knowing what to ignore.",
  "Deep work is the superpower of the 21st century.",
  "Do it now. Sometimes 'later' becomes 'never'.",
  "Great acts are made up of small deeds.",
  "Starve your distractions, feed your focus.",
  "You cannot do big things if you are distracted by small things.",
  "The shorter the way to do a thing, the harder the way is to find.",
  "Flow happens when you are fully immersed."
];

export default function DeepWorkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const { toast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer State
  const defaultMinutes = 25;
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [totalTime, setTotalTime] = useState(defaultMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [quote, setQuote] = useState("");

  const startTimeRef = useRef<Date | null>(null);
  const accumulatedTimeRef = useRef(0); // For pauses

  useEffect(() => {
    // Pick random quote
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    async function loadTask() {
      if (!taskId) {
        setError("No task selected for Deep Work.");
        setLoading(false);
        return;
      }
      try {
        const tasks = await getTasks();
        const found = tasks.find(t => t.id === taskId);
        if (found) {
          setTask(found);
          const estMinutes = found.estimated_minutes && found.estimated_minutes > 0 ? found.estimated_minutes : defaultMinutes;
          setTimeLeft(estMinutes * 60);
          setTotalTime(estMinutes * 60);
        } else {
          setError("Task not found.");
        }
      } catch (err) {
        setError("Error loading task.");
      } finally {
        setLoading(false);
      }
    }
    loadTask();
  }, [taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
        accumulatedTimeRef.current += 1;
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleFinish();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Controls
  const toggleTimer = () => {
    if (!isActive && !startTimeRef.current) {
      startTimeRef.current = new Date();
    }
    setIsActive(!isActive);
  };

  const handleFinish = async () => {
    setIsActive(false);
    
    if (accumulatedTimeRef.current < 60) {
      toast({
        title: "Session Too Short",
        description: "Focus sessions under 1 minute are not saved.",
      });
      router.back();
      return;
    }

    try {
      const start = startTimeRef.current || new Date();
      // Ensure end time accounts for the real elapsed seconds, not just current clock time (due to pauses)
      const end = new Date(start.getTime() + accumulatedTimeRef.current * 1000);

      await saveTimeLog({
        task_id: taskId || undefined,
        start_time: start,
        end_time: end,
        duration_seconds: accumulatedTimeRef.current,
        timer_type: 'deep_work'
      });
      
      toast({
        title: "Deep Work Saved",
        description: `Logged ${Math.round(accumulatedTimeRef.current / 60)} minutes of focus.`,
      });
      router.back();
    } catch (err: any) {
      toast({
        title: "Failed to save session",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    if (accumulatedTimeRef.current > 60) {
      if (!confirm("Are you sure you want to exit without saving your progress?")) {
        return;
      }
    }
    router.back();
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
    startTimeRef.current = null;
    accumulatedTimeRef.current = 0;
  };

  // Math for SVG Circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalTime) * circumference;

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">Loading Focus Mode...</div>;
  if (error) return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold mb-2">Error</h2>
      <p className="text-muted-foreground mb-6">{error}</p>
      <Button onClick={() => router.back()}>Return to Tasks</Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-background animate-in fade-in duration-300 flex flex-col">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between p-6">
        <Button variant="ghost" size="icon" onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
           <X className="h-6 w-6" />
        </Button>
        <div className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">Deep Work</div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        
        {/* Active Task Info */}
        <div className="text-center mb-12 space-y-2">
           <p className="text-sm font-medium text-emerald-500 uppercase tracking-widest">Focusing On</p>
           <h1 className="text-3xl md:text-5xl font-bold break-words">{task?.title}</h1>
           {task?.description && (
             <p className="text-muted-foreground max-w-md mx-auto line-clamp-2 mt-2">{task.description}</p>
           )}
        </div>

        {/* Circular Timer Display */}
        <div className="relative flex items-center justify-center mb-16">
          <svg className="transform -rotate-90 w-[300px] h-[300px]">
            {/* Background Ring */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted/20"
            />
            {/* Progress Ring */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-primary transition-all duration-1000 ease-linear"
            />
          </svg>
          
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-6xl font-black tracking-tighter tabular-nums font-mono drop-shadow-sm">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-2 block">
              {isActive ? "Flow State Active" : "Paused"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
           <Button variant="outline" size="icon" onClick={resetTimer} className="h-12 w-12 rounded-full hidden sm:flex" title="Reset Timer">
             <RefreshCcw className="h-5 w-5 text-muted-foreground" />
           </Button>
           
           <Button onClick={toggleTimer} size="lg" className="h-16 w-16 rounded-full shadow-lg hover:shadow-primary/20 transition-all">
             {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
           </Button>

           <Button variant="destructive" size="icon" onClick={handleFinish} className="h-12 w-12 rounded-full" title="Stop & Save">
             <Square className="h-5 w-5 fill-current" />
           </Button>
        </div>

        {/* Motivation */}
        <div className="mt-auto pt-16 text-center max-w-md mx-auto">
          <p className="text-lg font-serif italic text-muted-foreground">"{quote}"</p>
        </div>

      </div>
    </div>
  );
}

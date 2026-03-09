"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, RotateCcw, Timer as TimerIcon, Coffee, Quote } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/lib/types/task";
import { TimerType, DEFAULT_POMODORO_SETTINGS, TimeLogFormData } from "@/lib/types/time";
import { motion, AnimatePresence } from "framer-motion";

interface ActiveTimerProps {
  tasks: Task[];
  onSaveLog: (log: TimeLogFormData) => Promise<void>;
}

type PomodoroPhase = 'Focus' | 'Break';

export function ActiveTimer({ tasks, onSaveLog }: ActiveTimerProps) {
  // Timer settings
  const [timerType, setTimerType] = useState<TimerType>('Pomodoro');
  const [selectedTaskId, setSelectedTaskId] = useState<string>("unassigned");
  
  // Running state
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0); // For manual UP counting
  
  // Pomodoro specific state
  const [pomoPhase, setPomoPhase] = useState<PomodoroPhase>('Focus');
  const [pomoRemainingSeconds, setPomoRemainingSeconds] = useState(DEFAULT_POMODORO_SETTINGS.focusTime * 60);

  // Refs for tracking intervals
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalElapsedInSession = useRef<number>(0);

  const quotes = [
    "Focus is a matter of deciding what things you're not going to do.",
    "Starve your distractions, feed your focus.",
    "The successful warrior is the average man, with laser-like focus.",
    "Do whatever you do intensely.",
    "Your future is created by what you do today, not tomorrow.",
    "Deep work is the superpower of the 21st century."
  ];
  const [activeQuote, setActiveQuote] = useState(quotes[0]);

  useEffect(() => {
    if (isRunning) {
      setActiveQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, [isRunning]);

  // ---- EFFECT: Run the Timer ----
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (timerType === 'Manual') {
          setElapsedSeconds(prev => prev + 1);
          totalElapsedInSession.current += 1;
        } else {
          // Pomodoro
          setPomoRemainingSeconds(prev => {
            if (prev <= 1) {
              handlePomodoroComplete();
              return 0;
            }
            totalElapsedInSession.current += 1;
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timerType, pomoPhase]);

  // Handle phase change internally to avoid stale state in closure
  const handlePomodoroComplete = () => {
    setIsRunning(false);
    
    // Auto-save the focus session if completed
    if (pomoPhase === 'Focus' && startTime) {
      saveSession(DEFAULT_POMODORO_SETTINGS.focusTime * 60); // Save the full intended time
    }

    // Switch phases
    if (pomoPhase === 'Focus') {
      setPomoPhase('Break');
      setPomoRemainingSeconds(DEFAULT_POMODORO_SETTINGS.breakTime * 60);
      // Optional: Play a sound or show a system notification here
    } else {
      setPomoPhase('Focus');
      setPomoRemainingSeconds(DEFAULT_POMODORO_SETTINGS.focusTime * 60);
    }
    
    // Reset tracker
    totalElapsedInSession.current = 0;
    setStartTime(null);
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
      if (!startTime) {
        setStartTime(new Date());
      }
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setStartTime(null);
    totalElapsedInSession.current = 0;
    
    if (timerType === 'Manual') {
      setElapsedSeconds(0);
    } else {
      setPomoPhase('Focus');
      setPomoRemainingSeconds(DEFAULT_POMODORO_SETTINGS.focusTime * 60);
    }
  };

  const stopAndSave = async () => {
    if (totalElapsedInSession.current < 5) {
      // Too short to save
      resetTimer();
      return;
    }
    await saveSession(totalElapsedInSession.current);
    resetTimer();
  };

  const saveSession = async (durationSecs: number) => {
    if (!startTime) return;
    
    const end = new Date(); // now
    // If it was paused and then stopped, the elapsed time determines the true start
    const calculatedStart = new Date(end.getTime() - (durationSecs * 1000));
    
    await onSaveLog({
      task_id: selectedTaskId === "unassigned" ? null : selectedTaskId,
      start_time: calculatedStart,
      end_time: end,
      duration_seconds: durationSecs,
      timer_type: timerType
    });
  };

  // Switch timer mode safely
  const handleTypeChange = (type: TimerType) => {
    if (isRunning) return; // Prevent switching while running
    setTimerType(type);
    resetTimer();
  };

  // Formatting helpers
  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const displayTime = timerType === 'Manual' ? elapsedSeconds : pomoRemainingSeconds;
  
  // Styling
  const bgColors = {
    'Manual': 'bg-blue-500/5',
    'Pomodoro_Focus': 'bg-rose-500/5',
    'Pomodoro_Break': 'bg-emerald-500/5',
  };
  const activeBg = timerType === 'Manual' ? bgColors.Manual : (pomoPhase === 'Focus' ? bgColors.Pomodoro_Focus : bgColors.Pomodoro_Break);
  
  const textColors = {
    'Manual': 'text-blue-500',
    'Pomodoro_Focus': 'text-rose-500',
    'Pomodoro_Break': 'text-emerald-500',
  };
  const activeText = timerType === 'Manual' ? textColors.Manual : (pomoPhase === 'Focus' ? textColors.Pomodoro_Focus : textColors.Pomodoro_Break);

  // Progress calculations for rings
  const totalPomoSecs = pomoPhase === 'Focus' ? DEFAULT_POMODORO_SETTINGS.focusTime * 60 : DEFAULT_POMODORO_SETTINGS.breakTime * 60;
  const progressPercent = timerType === 'Pomodoro' 
    ? ((totalPomoSecs - pomoRemainingSeconds) / totalPomoSecs) * 100 
    : 100; // Manual ring is always full or slowly filling

  const activeTaskName = selectedTaskId && selectedTaskId !== 'unassigned' && tasks.length > 0
    ? tasks.find(t => t.id === selectedTaskId)?.title || "General Focus"
    : "General Focus";

  return (
    <>
    <Card className={`overflow-hidden transition-all duration-500 backdrop-blur-xl border border-border/50 shadow-lg ${isRunning ? activeBg : 'bg-card/80'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Active Timer</CardTitle>
            <CardDescription>Track time spent on tasks</CardDescription>
          </div>
          
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <Button 
              variant={timerType === 'Pomodoro' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={`h-7 px-3 text-xs ${timerType === 'Pomodoro' ? 'shadow-sm' : ''}`}
              onClick={() => handleTypeChange('Pomodoro')}
              disabled={isRunning}
            >
              Pomodoro
            </Button>
            <Button 
              variant={timerType === 'Manual' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={`h-7 px-3 text-xs ${timerType === 'Manual' ? 'shadow-sm' : ''}`}
              onClick={() => handleTypeChange('Manual')}
              disabled={isRunning}
            >
              Manual
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* State Banner */}
        <div className="flex justify-center h-6">
          {timerType === 'Pomodoro' && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${activeText}`}>
              {pomoPhase === 'Focus' ? <TimerIcon className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
              {pomoPhase} Phase
            </div>
          )}
          {timerType === 'Manual' && isRunning && (
             <div className={`flex items-center gap-1.5 text-sm font-medium ${activeText} animate-pulse`}>
             <span className="w-2 h-2 rounded-full bg-blue-500"></span> Recording
           </div>
          )}
        </div>

        {/* Time Display */}
        <div className="flex justify-center py-2">
          <span className={`text-7xl md:text-8xl font-bold tabular-nums tracking-tighter ${activeText}`}>
            {formatTime(displayTime)}
          </span>
        </div>

        {/* Task Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedTaskId} onValueChange={(val) => setSelectedTaskId(val || "unassigned")} disabled={isRunning}>
            <SelectTrigger className="w-full bg-background relative z-10">
              <SelectValue placeholder="Select a task to track..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">No Task (General Tracking)</SelectItem>
              {tasks.filter(t => t.status !== 'completed').map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 pt-2">
          {!isRunning && (totalElapsedInSession.current > 0 || displayTime < (timerType === 'Pomodoro' ? DEFAULT_POMODORO_SETTINGS.focusTime * 60 : Infinity)) ? (
             <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={resetTimer}>
               <RotateCcw className="h-5 w-5" />
             </Button>
          ) : (
            <div className="h-12 w-12"></div> // spacer
          )}

          <Button 
            className={`h-16 w-16 rounded-full shadow-lg ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
            onClick={toggleTimer}
          >
            {isRunning ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white translate-x-0.5" />}
          </Button>

          {timerType === 'Manual' || pomoPhase === 'Focus' ? (
            <Button 
              variant="outline" 
              size="icon" 
              className={`h-12 w-12 rounded-full transition-opacity ${totalElapsedInSession.current > 5 ? 'opacity-100 hover:text-rose-500' : 'opacity-30 cursor-not-allowed'}`}
              onClick={stopAndSave}
              disabled={totalElapsedInSession.current <= 5}
              title="Stop and Save"
            >
              <Square className="h-5 w-5" />
            </Button>
          ) : (
            <div className="h-12 w-12"></div> // spacer during break phase
          )}
        </div>
      </CardContent>
    </Card>

    {/* DEEP WORK FULLSCREEN OVERLAY */}
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(30px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-background/95 flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden"
        >
          {/* Abstract ambient light */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute w-[60vh] h-[60vh] rounded-full blur-[120px] opacity-40 pointer-events-none ${timerType === 'Manual' ? 'bg-blue-500/20' : (pomoPhase === 'Focus' ? 'bg-indigo-500/20' : 'bg-emerald-500/20')}`}
          />

          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
            className="relative z-10 flex flex-col items-center w-full max-w-2xl"
          >
            {/* Task Name & Phase */}
            <div className="text-center mb-12 space-y-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border border-white/10 ${activeText} bg-white/5 backdrop-blur-md`}>
                {timerType === 'Pomodoro' ? `${pomoPhase} Phase` : 'Deep Work Mode'}
              </span>
              <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tighter text-foreground drop-shadow-md max-w-xl mx-auto line-clamp-2">
                {activeTaskName}
              </h2>
            </div>

            {/* Massive Circular Timer */}
            <div className="relative flex items-center justify-center mb-16 shadow-2xl rounded-full">
              <svg className="w-64 h-64 md:w-80 md:h-80 transform -rotate-90 drop-shadow-2xl">
                <circle cx="50%" cy="50%" r="48%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/20" />
                <motion.circle 
                  cx="50%" cy="50%" r="48%" stroke="currentColor" strokeWidth="6" fill="transparent"
                  strokeDasharray={2 * Math.PI * 150} // Approximate radius for 80 units
                  strokeDashoffset={timerType === 'Pomodoro' ? `calc(${2 * Math.PI * 150} * (1 - ${progressPercent} / 100))` : 0}
                  className={`${activeText} transition-all duration-1000 ease-linear`}
                  style={timerType === 'Manual' ? { strokeDasharray: "4 12", animation: "spin 30s linear infinite" } : {}}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className={`text-6xl md:text-8xl font-heading font-black tabular-nums tracking-tighter ${activeText} drop-shadow-lg`}>
                  {formatTime(displayTime)}
                </span>
                {timerType === 'Pomodoro' && (
                  <span className="text-muted-foreground font-medium mt-2">
                    {Math.round(progressPercent)}% Completed
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-6 mb-16">
              <Button 
                className={`h-20 w-20 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all text-white border-2 border-white/10 ${isRunning ? 'bg-amber-500/80 hover:bg-amber-500 backdrop-blur-md' : 'bg-primary/90 hover:bg-primary'}`}
                onClick={toggleTimer}
              >
                {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 translate-x-1" />}
              </Button>

              {(timerType === 'Manual' || pomoPhase === 'Focus') && (
                <Button 
                  variant="outline" 
                  className={`h-20 w-20 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all bg-background/50 backdrop-blur-md border border-white/10 ${totalElapsedInSession.current > 5 ? 'hover:text-rose-500 hover:border-rose-500/50' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => {
                     stopAndSave();
                     setIsRunning(false); // Make sure overlay closes immediately
                  }}
                  disabled={totalElapsedInSession.current <= 5}
                >
                  <Square className="h-8 w-8" />
                </Button>
              )}
            </div>

            {/* Quote */}
            <div className="text-center max-w-lg mx-auto opacity-80">
              <Quote className="h-6 w-6 mx-auto mb-3 opacity-50 text-muted-foreground" />
              <p className="text-lg md:text-xl font-medium font-heading italic text-muted-foreground leading-relaxed">
                "{activeQuote}"
              </p>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

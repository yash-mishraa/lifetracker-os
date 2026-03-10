//metric-rings.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardSummary } from "@/lib/services/dashboard-service";
import { CheckCircle2, Flame, HeartPulse } from "lucide-react";
import { motion, Variants } from "framer-motion";

interface MetricRingsProps {
  summary: DashboardSummary;
}

export function MetricRings({ summary }: MetricRingsProps) {
  // Calculate Progress Percentages
  const taskPct = summary.tasks.totalDueTodayCount > 0 
    ? (summary.tasks.completedTodayCount / summary.tasks.totalDueTodayCount) * 100 
    : 100; // If no tasks due, consider it 100% implicitly, or leave at 0 depending on preference. Let's use 0 to encourage adding tasks if empty, but 100 if they finished them.
    
  const habitPct = summary.habits.totalScheduledTodayCount > 0 
    ? (summary.habits.completedTodayCount / summary.habits.totalScheduledTodayCount) * 100 
    : 100;
    
  // Cap health at 3 logs for 100% just as an example goal target
  const healthPct = Math.min((summary.health.loggedMetricsCount / 4) * 100, 100);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      
      {/* Task Ring */}
      <motion.div variants={item}>
      <Card className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 shadow-lg shadow-blue-500/5 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-colors">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="relative flex items-center justify-center mb-4 z-10">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/30" />
            <motion.circle 
              cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (isNaN(taskPct)? 0 : taskPct) / 100) }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              className="text-blue-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-blue-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
        <div className="text-center z-10">
          <div className="text-3xl font-heading font-bold tracking-tight text-blue-500">{summary.tasks.completedTodayCount} <span className="text-xl text-muted-foreground font-semibold">/ {summary.tasks.totalDueTodayCount}</span></div>
          <div className="text-sm text-muted-foreground font-medium mt-1">Tasks Done</div>
        </div>
      </Card>
      </motion.div>

      {/* Habit Ring */}
      <motion.div variants={item}>
      <Card className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 shadow-lg shadow-orange-500/5 backdrop-blur-xl relative overflow-hidden group hover:border-orange-500/40 transition-colors">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-orange-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="relative flex items-center justify-center mb-4 z-10">
          <svg className="w-24 h-24 transform -rotate-90">
             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/30" />
            <motion.circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (isNaN(habitPct)? 0 : habitPct) / 100) }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
              className="text-orange-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-orange-500">
            <Flame className="h-6 w-6" />
          </div>
        </div>
        <div className="text-center z-10">
          <div className="text-3xl font-heading font-bold tracking-tight text-orange-500">{summary.habits.completedTodayCount} <span className="text-xl text-muted-foreground font-semibold">/ {summary.habits.totalScheduledTodayCount}</span></div>
          <div className="text-sm text-muted-foreground font-medium mt-1">Habits Hit</div>
        </div>
      </Card>
      </motion.div>

      {/* Health Ring */}
      <motion.div variants={item}>
      <Card className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 shadow-lg shadow-emerald-500/5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="relative flex items-center justify-center mb-4 z-10">
          <svg className="w-24 h-24 transform -rotate-90">
             <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/30" />
            <motion.circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (isNaN(healthPct)? 0 : healthPct) / 100) }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
              className="text-emerald-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-emerald-500">
            <HeartPulse className="h-6 w-6" />
          </div>
        </div>
        <div className="text-center z-10">
          <div className="text-3xl font-heading font-bold tracking-tight text-emerald-500">{summary.health.loggedMetricsCount} <span className="text-xl text-muted-foreground font-semibold">/ 4</span></div>
          <div className="text-sm text-muted-foreground font-medium mt-1">Health Logs</div>
        </div>
      </Card>
      </motion.div>

    </motion.div>
  );
}

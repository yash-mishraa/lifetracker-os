"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, CheckCircle2, ListTodo } from "lucide-react";
import { motion, Variants } from "framer-motion";

interface HabitStatsOverviewProps {
  totalActive: number;
  averageCompletionRate: number;
  bestStreakOverride?: number; // optionally derived from all habits
  currentStreakOverall?: number;
}

export function HabitStatsOverview({
  totalActive,
  averageCompletionRate,
  bestStreakOverride = 0,
  currentStreakOverall = 0,
}: HabitStatsOverviewProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <motion.div variants={item}>
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Highest Active Streak</span>
          </div>
          <div className="text-3xl font-heading font-bold tracking-tight mt-1">{currentStreakOverall} <span className="text-sm font-normal text-muted-foreground tracking-normal">days</span></div>
        </CardContent>
      </Card>
      </motion.div>
      
      <motion.div variants={item}>
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Longest Streak</span>
          </div>
          <div className="text-3xl font-heading font-bold tracking-tight mt-1">{bestStreakOverride} <span className="text-sm font-normal text-muted-foreground tracking-normal">days</span></div>
        </CardContent>
      </Card>
      </motion.div>
      
      <motion.div variants={item}>
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">30-Day Completion</span>
          </div>
          <div className="text-3xl font-heading font-bold tracking-tight mt-1">{averageCompletionRate}%</div>
        </CardContent>
      </Card>
      </motion.div>
      
      <motion.div variants={item}>
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <ListTodo className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Habits</span>
          </div>
          <div className="text-3xl font-heading font-bold tracking-tight mt-1">{totalActive}</div>
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  );
}

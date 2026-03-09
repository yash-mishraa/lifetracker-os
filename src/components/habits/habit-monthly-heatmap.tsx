"use client";

import { Habit, HabitLog } from "@/lib/types/habit";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } from "date-fns";
import { motion } from "framer-motion";

interface HabitMonthlyHeatmapProps {
  habit: Habit;
  logs: HabitLog[];
  monthDate?: Date; // Defaults to current month
}

export function HabitMonthlyHeatmap({ habit, logs, monthDate = new Date() }: HabitMonthlyHeatmapProps) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });
  
  // 0 = Sunday. Assuming grid starts on Sunday.
  const startOffset = getDay(start); 

  const monthName = format(start, "MMMM yyyy");

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">{monthName}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted border border-border" />
            <div className="w-3 h-3 rounded-sm opacity-40" style={{ backgroundColor: habit.color }} />
            <div className="w-3 h-3 rounded-sm opacity-70" style={{ backgroundColor: habit.color }} />
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: habit.color }} />
          </div>
          <span>More</span>
        </div>
      </div>

      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.015 } }
        }}
        className="grid grid-cols-7 gap-1.5 sm:gap-2"
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground uppercase">
            {day}
          </div>
        ))}

        {/* Empty offset days */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="w-full aspect-square bg-transparent" />
        ))}

        {/* Actual days */}
        {days.map(date => {
          const dateStr = format(date, "yyyy-MM-dd");
          const log = logs.find(l => l.date === dateStr);
          
          let opacity = 0;
          let bgColor = "transparent";
          let borderClass = "border border-border bg-muted/30";

          if (habit.type === "binary" && log?.completed) {
            opacity = 1;
          } else if (habit.type === "quantitative" && log?.value) {
            opacity = Math.min(1, log.value / habit.target_value);
            // Boost small opacity so it's visible
            if (opacity > 0 && opacity < 0.3) opacity = 0.3;
          }

          if (opacity > 0) {
            bgColor = habit.color;
            borderClass = ""; // remove standard border if filled
          }

          return (
            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1 } }}
              key={dateStr}
              className={`w-full aspect-square rounded-sm relative group overflow-hidden ${borderClass}`}
              title={`${format(date, "MMM d")}: ${log?.value || (log?.completed ? 1 : 0)} / ${habit.type === 'quantitative' ? habit.target_value : 1}`}
            >
              <div 
                className="absolute inset-0 transition-opacity" 
                style={{ backgroundColor: bgColor, opacity }} 
              />
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] 
                ${opacity > 0.6 ? 'text-white' : 'text-muted-foreground'}`
              }>
                {format(date, "d")}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

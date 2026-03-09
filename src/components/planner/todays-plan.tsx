"use client";

import { useEffect, useState } from "react";
import { getTodaySchedule } from "@/lib/services/planner-service";
import { TimeBlock } from "@/lib/types/planner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TodaysPlan() {
  const [schedule, setSchedule] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      const blocks = await getTodaySchedule();
      // Only show up to 4 items on the dashboard
      setSchedule(blocks.slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-full bg-gradient-to-b from-card to-card/50">
      <CardHeader className="border-b pb-4 px-6 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          Today's Plan
        </CardTitle>
        <Link href="/planner" className="hidden sm:flex items-center text-xs h-8 px-3 rounded-md hover:bg-accent text-indigo-500 font-medium transition-colors">
            Full Planner <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col justify-start">
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse bg-muted h-2 w-1/3 rounded"></div>
          </div>
        ) : schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/10 m-4 rounded-lg flex-1">
            <p className="text-sm text-muted-foreground mb-3">Your schedule is empty.</p>
            <Link href="/planner" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3">
              Auto-Schedule Day
            </Link>
          </div>
        ) : (
          <div className="flex-1 w-full flex flex-col p-4 space-y-3">
            <div className="relative border-l-2 border-muted ml-3 pl-4 pt-1 pb-1 space-y-4">
              {schedule.map((block) => (
                <div key={block.id} className={cn("relative flex items-center justify-between", block.isCompleted && "opacity-50")}>
                  {/* Dot */}
                  <div className={cn(
                    "absolute -left-[21px] mt-1 h-2.5 w-2.5 rounded-full ring-4 ring-background",
                    block.isCompleted ? "bg-muted-foreground" :
                    block.energyLevel === 'High' ? "bg-blue-500" :
                    block.energyLevel === 'Medium' ? "bg-indigo-500" :
                    block.type === 'habit' ? "bg-orange-500" : "bg-slate-500"
                  )} />
                  
                  <div className="flex-1 min-w-0 pr-3 cursor-default group">
                    <p className={cn("text-sm font-medium truncate", block.isCompleted && "line-through text-muted-foreground")}>
                      {block.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-medium tracking-wide">
                      {block.startTime} - {block.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <Link href="/planner" className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground w-full text-xs text-muted-foreground bg-muted/30 hover:bg-muted/50 h-8 px-3">
                 View Full Timeline
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

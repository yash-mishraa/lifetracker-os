"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { DisciplineScore } from "@/lib/types/discipline";
import { format, parseISO } from "date-fns";

interface DisciplineChartProps {
  history: DisciplineScore[];
}

export function DisciplineChart({ history }: DisciplineChartProps) {
  const chartData = useMemo(() => {
    return history.map(h => ({
      date: format(parseISO(h.date), 'MMM d'),
      score: h.totalScore,
      label: h.label
    }));
  }, [history]);

  if (!history || history.length === 0) return null;

  return (
    <div className="h-[80px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
             dataKey="date" 
             axisLine={false} 
             tickLine={false} 
             tick={{ fontSize: 10, fill: '#888888' }} 
             dy={5}
             minTickGap={15}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover text-popover-foreground text-xs p-2 rounded-md shadow-md border focus-visible:outline-hidden">
                    <p className="font-semibold">{payload[0].payload.date}</p>
                    <p className="text-violet-500 font-bold">{payload[0].value} <span className="text-muted-foreground font-normal">({payload[0].payload.label})</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
             type="monotone" 
             dataKey="score" 
             stroke="#8b5cf6" 
             strokeWidth={2}
             fillOpacity={1} 
             fill="url(#colorScore)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { DailyCompletion } from "@/lib/types/habit-analytics";
import { format, parseISO } from "date-fns";

export function HabitConsistencyGraph({ data }: { data: DailyCompletion[] }) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      date: format(parseISO(d.date), 'MMM d'),
      rate: d.completionRate
    }));
  }, [data]);

  if (!data || data.length === 0) return null;

  return (
    <div className="h-[250px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" strokeOpacity={0.2} />
          <XAxis 
             dataKey="date" 
             axisLine={false} 
             tickLine={false} 
             tick={{ fontSize: 10, fill: '#888888' }} 
             dy={10}
             minTickGap={30}
          />
          <YAxis 
             axisLine={false} 
             tickLine={false} 
             tick={{ fontSize: 10, fill: '#888888' }}
             domain={[0, 100]}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover text-popover-foreground text-xs p-3 rounded-md shadow-md border focus-visible:outline-hidden">
                    <p className="font-semibold mb-1">{payload[0].payload.date}</p>
                    <p className="text-emerald-500 font-bold">Completion: {payload[0].value}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
             type="monotone" 
             dataKey="rate" 
             stroke="#10b981" 
             strokeWidth={3}
             dot={false}
             activeDot={{ r: 6, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

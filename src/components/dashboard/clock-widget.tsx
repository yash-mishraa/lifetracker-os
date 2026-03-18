"use client";

import { useEffect, useState } from "react";
import { format, getDayOfYear } from "date-fns";
import { cn } from "@/lib/utils";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue.", author: "Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "You are never too old to set another goal.", author: "C.S. Lewis" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Thoreau" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Small steps every day lead to big results.", author: "Unknown" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The harder you work, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Stay focused, go after your dreams and keep moving toward your goals.", author: "LL Cool J" },
  { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

const DAYS = ["S","M","T","W","T","F","S"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const dayOfYear = getDayOfYear(now);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const secStr = String(seconds).padStart(2, "0");

  return (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">

      {/* ── Clock + Time ── */}
      <div className="flex items-center gap-3 p-4 border-b">
        {/* Analog clock — compact */}
        <div className="shrink-0">
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="23" className="fill-muted/20 stroke-border" strokeWidth="1" />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 - 90) * (Math.PI / 180);
              const isMajor = i % 3 === 0;
              const r1 = isMajor ? 17 : 19;
              return (
                <line key={i}
                  x1={26 + r1 * Math.cos(a)} y1={26 + r1 * Math.sin(a)}
                  x2={26 + 21 * Math.cos(a)} y2={26 + 21 * Math.sin(a)}
                  className={isMajor ? "stroke-foreground/50" : "stroke-foreground/20"}
                  strokeWidth={isMajor ? 1.5 : 0.8} strokeLinecap="round"
                />
              );
            })}
            {/* Hour hand */}
            <line x1="26" y1="26"
              x2={26 + 11 * Math.cos((hourAngle - 90) * Math.PI / 180)}
              y2={26 + 11 * Math.sin((hourAngle - 90) * Math.PI / 180)}
              className="stroke-foreground" strokeWidth="2" strokeLinecap="round" />
            {/* Minute hand */}
            <line x1="26" y1="26"
              x2={26 + 16 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
              y2={26 + 16 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
              className="stroke-foreground/80" strokeWidth="1.5" strokeLinecap="round" />
            {/* Second hand */}
            <line
              x1={26 - 4 * Math.cos((secondAngle - 90) * Math.PI / 180)}
              y1={26 - 4 * Math.sin((secondAngle - 90) * Math.PI / 180)}
              x2={26 + 18 * Math.cos((secondAngle - 90) * Math.PI / 180)}
              y2={26 + 18 * Math.sin((secondAngle - 90) * Math.PI / 180)}
              className="stroke-indigo-500" strokeWidth="1" strokeLinecap="round" />
            <circle cx="26" cy="26" r="2" className="fill-indigo-500" />
          </svg>
        </div>

        {/* Digital */}
        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-0.5 leading-none">
            <span className="text-2xl font-bold tracking-tight tabular-nums">{timeStr}</span>
            <span className="text-sm text-muted-foreground tabular-nums mb-0.5">:{secStr}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{format(now, "EEE, MMM d, yyyy")}</p>
        </div>
      </div>

      {/* ── Mini Calendar ── */}
      <div className="p-4 border-b select-none">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
          {format(now, "MMMM yyyy")}
        </p>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-[9px] font-medium text-muted-foreground/40">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-px">
          {cells.map((day, i) => (
            <div key={i} className="flex items-center justify-center">
              {day ? (
                <span className={cn(
                  "h-5 w-5 flex items-center justify-center rounded-full text-[10px] font-medium",
                  day === today ? "bg-foreground text-background font-bold" : "text-foreground/60"
                )}>
                  {day}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily Quote ── */}
      <div className="p-4 flex-1 flex flex-col justify-center bg-gradient-to-br from-indigo-500/5 to-transparent">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400/70 mb-1.5">
          Today's Quote
        </p>
        <p className="text-xs text-foreground/85 leading-relaxed italic line-clamp-3">
          "{quote.text}"
        </p>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">— {quote.author}</p>
      </div>
    </div>
  );
}
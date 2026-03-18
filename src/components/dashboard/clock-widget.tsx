"use client";

import { useEffect, useState } from "react";
import { format, getDayOfYear } from "date-fns";
import { cn } from "@/lib/utils";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "What you get by achieving your goals is not as important as what you become.", author: "Thoreau" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Small steps every day lead to big results.", author: "Unknown" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Stay focused, go after your dreams and keep moving toward your goals.", author: "LL Cool J" },
  { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
  const is24 = true;

  // Clock hand angles
  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  // Daily quote — changes by day of year
  const dayOfYear = getDayOfYear(now);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  // Mini calendar
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  // Shift so Monday = 0
  const offset = (firstDay + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const timeStr = is24
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    : `${String(hours % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  const secStr = String(seconds).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Clock + Time ── */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-5">
        {/* Analog clock */}
        <div className="shrink-0 relative">
          <svg width="80" height="80" viewBox="0 0 80 80" className="overflow-visible">
            {/* Face */}
            <circle cx="40" cy="40" r="36" className="fill-muted/20 stroke-border" strokeWidth="1.5" />
            {/* Hour markers */}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 - 90) * (Math.PI / 180);
              const isMajor = i % 3 === 0;
              const r1 = isMajor ? 28 : 30;
              const r2 = 33;
              return (
                <line key={i}
                  x1={40 + r1 * Math.cos(a)} y1={40 + r1 * Math.sin(a)}
                  x2={40 + r2 * Math.cos(a)} y2={40 + r2 * Math.sin(a)}
                  className={isMajor ? "stroke-foreground/60" : "stroke-foreground/25"}
                  strokeWidth={isMajor ? 2 : 1}
                  strokeLinecap="round"
                />
              );
            })}
            {/* Hour hand */}
            <line
              x1="40" y1="40"
              x2={40 + 18 * Math.cos((hourAngle - 90) * Math.PI / 180)}
              y2={40 + 18 * Math.sin((hourAngle - 90) * Math.PI / 180)}
              className="stroke-foreground" strokeWidth="3" strokeLinecap="round"
            />
            {/* Minute hand */}
            <line
              x1="40" y1="40"
              x2={40 + 26 * Math.cos((minuteAngle - 90) * Math.PI / 180)}
              y2={40 + 26 * Math.sin((minuteAngle - 90) * Math.PI / 180)}
              className="stroke-foreground/80" strokeWidth="2" strokeLinecap="round"
            />
            {/* Second hand */}
            <line
              x1={40 - 7 * Math.cos((secondAngle - 90) * Math.PI / 180)}
              y1={40 - 7 * Math.sin((secondAngle - 90) * Math.PI / 180)}
              x2={40 + 28 * Math.cos((secondAngle - 90) * Math.PI / 180)}
              y2={40 + 28 * Math.sin((secondAngle - 90) * Math.PI / 180)}
              className="stroke-indigo-500" strokeWidth="1.5" strokeLinecap="round"
            />
            {/* Center dot */}
            <circle cx="40" cy="40" r="3" className="fill-indigo-500" />
          </svg>
        </div>

        {/* Digital time */}
        <div className="min-w-0">
          <div className="flex items-end gap-1 leading-none">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-foreground">
              {timeStr}
            </span>
            <span className="text-lg font-medium text-muted-foreground tabular-nums mb-0.5">
              :{secStr}
            </span>
            {!is24 && (
              <span className="text-sm font-semibold text-muted-foreground mb-1 ml-1">{ampm}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            {format(now, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* ── Mini Calendar ── */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm select-none flex-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">
            {MONTHS[month]} {year}
          </span>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground/50 py-0.5">
              {d[0]}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, i) => (
            <div key={i} className="flex items-center justify-center">
              {day ? (
                <span className={cn(
                  "h-7 w-7 flex items-center justify-center rounded-full text-xs font-medium transition-all",
                  day === today
                    ? "bg-foreground text-background font-bold"
                    : "text-foreground/70 hover:bg-muted/60"
                )}>
                  {day}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* ── Daily Quote ── */}
      <div className="bg-gradient-to-br from-indigo-500/8 to-purple-500/5 border border-indigo-500/20 rounded-2xl p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400/70 mb-2">
          Today's Quote
        </p>
        <p className="text-sm text-foreground/90 leading-relaxed italic">
          "{quote.text}"
        </p>
        <p className="text-[11px] text-muted-foreground mt-2 font-medium">
          — {quote.author}
        </p>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

export function PageClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = format(now, "HH:mm");
  const date = format(now, "EEE, MMM d");

  return (
    <div className="flex items-center gap-2 text-muted-foreground/70 select-none">
      <span className="text-sm font-medium tabular-nums">{time}</span>
      <span className="text-muted-foreground/30">·</span>
      <span className="text-sm">{date}</span>
    </div>
  );
}
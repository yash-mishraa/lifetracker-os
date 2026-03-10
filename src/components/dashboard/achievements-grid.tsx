"use client";

import { AchievementBadge } from "@/lib/types/gamification";
import { Flame, Target, Trophy, CheckCircle, Brain, Calendar, Lock, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementsGridProps {
  achievements: AchievementBadge[];
}

const getIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case "Flame":       return <Flame className={className} />;
    case "Calendar":    return <Calendar className={className} />;
    case "CheckCircle": return <CheckCircle className={className} />;
    case "Brain":       return <Brain className={className} />;
    case "Target":      return <Target className={className} />;
    default:            return <Trophy className={className} />;
  }
};

const BADGE_THEMES: Record<string, { 
  gradient: string; 
  glow: string; 
  ring: string;
  iconBg: string;
  iconColor: string;
  bar: string;
}> = {
  "streak-7":  { gradient: "from-orange-500/20 via-orange-500/5 to-transparent", glow: "shadow-orange-500/20", ring: "border-orange-500/40", iconBg: "bg-orange-500/15", iconColor: "text-orange-400", bar: "bg-orange-500" },
  "streak-30": { gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent", glow: "shadow-indigo-500/20", ring: "border-indigo-500/40", iconBg: "bg-indigo-500/15", iconColor: "text-indigo-400", bar: "bg-indigo-500" },
  "tasks-100": { gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent", glow: "shadow-emerald-500/20", ring: "border-emerald-500/40", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", bar: "bg-emerald-500" },
  "focus-50":  { gradient: "from-purple-500/20 via-purple-500/5 to-transparent", glow: "shadow-purple-500/20", ring: "border-purple-500/40", iconBg: "bg-purple-500/15", iconColor: "text-purple-400", bar: "bg-purple-500" },
};

const DEFAULT_THEME = { gradient: "from-slate-500/20 via-slate-500/5 to-transparent", glow: "shadow-slate-500/20", ring: "border-slate-500/40", iconBg: "bg-slate-500/15", iconColor: "text-slate-400", bar: "bg-slate-500" };

function BadgeCard({ badge }: { badge: AchievementBadge }) {
  const theme = BADGE_THEMES[badge.id] ?? DEFAULT_THEME;
  const pct = badge.totalRequired ? Math.min(((badge.progress ?? 0) / badge.totalRequired) * 100, 100) : 0;
  const displayProgress = typeof badge.progress === 'number' 
    ? Number.isInteger(badge.progress) ? badge.progress : badge.progress.toFixed(1)
    : 0;

  return (
    <div className={cn(
      "relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-300 overflow-hidden group",
      badge.isUnlocked
        ? cn("bg-gradient-to-b", theme.gradient, theme.ring, "shadow-lg", theme.glow, "hover:-translate-y-1 hover:shadow-xl")
        : "bg-muted/20 border-border/40 border-dashed hover:bg-muted/30"
    )}>

      {/* Locked overlay shimmer */}
      {!badge.isUnlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      {/* Unlocked sparkle top-right */}
      {badge.isUnlocked && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5">
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
        </div>
      )}

      {/* Lock icon top-right for locked */}
      {!badge.isUnlocked && (
        <div className="absolute top-2.5 right-2.5">
          <Lock className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}

      {/* Icon */}
      <div className={cn(
        "h-14 w-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300",
        badge.isUnlocked ? cn(theme.iconBg, "group-hover:scale-110") : "bg-muted/40"
      )}>
        {getIcon(badge.icon, cn(
          "h-7 w-7 transition-all",
          badge.isUnlocked ? theme.iconColor : "text-muted-foreground/30"
        ))}
      </div>

      {/* Title */}
      <h4 className={cn(
        "font-semibold text-sm mb-1 leading-tight",
        !badge.isUnlocked && "text-muted-foreground/60"
      )}>
        {badge.title}
      </h4>

      {/* Description */}
      <p className={cn(
        "text-[11px] leading-relaxed line-clamp-2",
        badge.isUnlocked ? "text-muted-foreground" : "text-muted-foreground/40"
      )}>
        {badge.description}
      </p>

      {/* Progress section */}
      <div className="w-full mt-4 space-y-1.5">
        {badge.isUnlocked ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Unlocked</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-[10px] font-medium text-muted-foreground/60">
              <span>{displayProgress}</span>
              <span className="font-semibold">{badge.totalRequired}</span>
            </div>
            {/* Custom progress bar */}
            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", theme.bar, "opacity-60")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/50 font-medium">
              {Math.round(pct)}% complete
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-yellow-500/15 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Trophies</h3>
            <p className="text-xs text-muted-foreground">Badges earned from your consistency</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {achievements.map((a, i) => (
              <div key={i} className={cn(
                "h-2 w-2 rounded-full transition-all",
                a.isUnlocked ? "bg-yellow-400" : "bg-muted"
              )} />
            ))}
          </div>
          <span className="text-xs font-semibold text-muted-foreground ml-1">
            {unlockedCount} / {achievements.length}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {achievements.map(badge => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>

      {/* XP bar at bottom */}
      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            <span>Overall Progress</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">{unlockedCount * 25} / 100 XP</span>
        </div>
        <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-1000"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string; // e.g., "Flame", "Target", "Trophy" (Lucide icon name mapped in UI)
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  totalRequired?: number;
  colorClass: string;
}

export interface GamificationStats {
  consistencyScore: number; // 0-100 (Rolling 30 days)
  streaks: {
    habits: number;       // Current longest active habit streak (or an aggregate of all)
    productivity: number; // Consecutive days hitting > 0 tasks or habits
    focus: number;        // Consecutive days with > 0 focus time logged
  };
  achievements: AchievementBadge[];
}

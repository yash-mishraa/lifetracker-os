export type DisciplineLabel = 'Unfocused' | 'Improving' | 'Disciplined' | 'Elite';

export interface DisciplineMetrics {
  taskScore: number;   // Max 40
  habitScore: number;  // Max 30
  focusScore: number;  // Max 20
  healthScore: number; // Max 10
}

export interface DisciplineScore extends DisciplineMetrics {
  date: string;        // ISO yyyy-MM-dd
  totalScore: number;  // 0 - 100
  label: DisciplineLabel;
}

export interface DisciplineHistory {
  today: DisciplineScore;
  weeklyAverage: number;
  monthlyAverage: number;
  history: DisciplineScore[]; // e.g. last 7 days for the chart
}

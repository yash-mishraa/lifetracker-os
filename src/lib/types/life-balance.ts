export type LifeArea = 'Work' | 'Health' | 'Learning' | 'Personal' | 'Finance' | 'Social';

export interface LifeBalanceScore {
  area: LifeArea;
  score: number; // 0 to 100
  label: string; // The display name
  fullMark: number; // Usually 100, for radar chart display
}

export interface LifeBalanceData {
  scores: LifeBalanceScore[];
  overallBalanceScore: number; // 0 to 100
  lastUpdated: string;
}

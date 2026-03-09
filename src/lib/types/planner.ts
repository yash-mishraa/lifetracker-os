export type BlockType = 'task' | 'habit' | 'focus' | 'break';

export type EnergyLevel = 'High' | 'Medium' | 'Low';

export interface TimeBlock {
  id: string; // unique ID for the block
  type: BlockType;
  title: string;
  description?: string;
  energyLevel?: EnergyLevel;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "10:30"
  sourceId?: string; // ID of the underlying task/habit
  isLocked?: boolean; // If true, the auto-scheduler won't move this block
  isCompleted?: boolean;
}

export interface DaySchedule {
  date: string; // ISO yyyy-MM-dd
  blocks: TimeBlock[];
}

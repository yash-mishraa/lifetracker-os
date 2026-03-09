"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TimeBlock } from "@/lib/types/planner";
import { TimeBlockItem } from "./time-block";

interface DailyTimelineProps {
  initialBlocks: TimeBlock[];
  onScheduleChange?: (updatedBlocks: TimeBlock[]) => void;
  onToggleComplete?: (id: string, isCompleted: boolean) => void;
}

export function DailyTimeline({ initialBlocks, onScheduleChange, onToggleComplete }: DailyTimelineProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex((item) => item.id === active.id);
      const newIndex = blocks.findIndex((item) => item.id === over?.id);

      const newArray = arrayMove(blocks, oldIndex, newIndex);
      
      let currentTime = parseTimeToMinutes(newArray[0]?.startTime || "09:00");
      
      const updatedArray = newArray.map((block, idx) => {
        if (block.isLocked) {
           currentTime = parseTimeToMinutes(block.endTime);
           return block;
        }
        
        const duration = parseTimeToMinutes(block.endTime) - parseTimeToMinutes(block.startTime);
        const newStartStr = minutesToTimeString(currentTime);
        const newEndStr = minutesToTimeString(currentTime + duration);
        
        currentTime += duration;
        currentTime += 5;

        return {
          ...block,
          startTime: newStartStr,
          endTime: newEndStr,
        };
      });

      setBlocks(updatedArray);
      if (onScheduleChange) onScheduleChange(updatedArray);
    }
  }

  // Helpers to re-calculate times
  const parseTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };
  
  const minutesToTimeString = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="relative border-l-2 border-muted pl-6 ml-4">
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block) => (
              <div key={block.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-4 h-3 w-3 rounded-full bg-primary ring-4 ring-background z-10" />
                <TimeBlockItem 
                   block={block} 
                   onToggleComplete={onToggleComplete} 
                />
              </div>
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}

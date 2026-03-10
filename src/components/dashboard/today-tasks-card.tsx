//today-tasks-card.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/lib/types/task";
import { updateTask } from "@/lib/services/task-service";
import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface TodayTasksCardProps {
  initialTasks: Task[];
  onTaskChange: () => void; // Trigger a reload of the parent dashboard
}

export function TodayTasksCard({ initialTasks, onTaskChange }: TodayTasksCardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const { toast } = useToast();

  const handleToggle = async (task: Task) => {
    const isEditingToComplete = task.status !== 'completed';
    
    // Optimistic UI Update
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: isEditingToComplete ? 'completed' : 'todo' } : t
    ));

    try {
      await updateTask(task.id, { 
        status: isEditingToComplete ? 'completed' : 'todo',
        completed_at: isEditingToComplete ? new Date().toISOString() : null
      });
      onTaskChange(); // Tell parent to fetch new summary to update rings/score
    } catch (err: any) {
      toast({ title: "Error updating task", description: err.message, variant: "destructive" });
      // Revert Optimistic
      setTasks(initialTasks);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Today's Tasks</CardTitle>
            <CardDescription>Priority items for the day</CardDescription>
          </div>
          <Badge variant="secondary" className="font-medium text-xs">
            {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1 overflow-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
            <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No tasks due today!</p>
            <p className="text-xs mt-1">Enjoy your free time or add a new task.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const isDone = task.status === 'completed';
              return (
                <div 
                  key={task.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isDone ? 'bg-muted/30 border-transparent opacity-60' : 'bg-card hover:border-primary/30 hover:shadow-sm'
                  }`}
                >
                  <Checkbox 
                    checked={isDone} 
                    onCheckedChange={() => handleToggle(task)} 
                    className="mt-1 flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-sm font-medium leading-none truncate ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.project && (
                       <span className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{task.project.name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

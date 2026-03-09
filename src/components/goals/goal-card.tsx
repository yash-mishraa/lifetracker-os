"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Target, Edit, Trash, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GoalWithMilestones, Milestone } from "@/lib/types/goal";
import { format, differenceInDays } from "date-fns";

interface GoalCardProps {
  goal: GoalWithMilestones;
  onEditGoal: (goal: GoalWithMilestones) => void;
  onDeleteGoal: (id: string) => void;
  onAddMilestone: (goalId: string) => void;
  onEditMilestone: (milestone: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
  onToggleMilestone: (milestone: Milestone, isCompleted: boolean) => void;
}

export function GoalCard({ 
  goal, 
  onEditGoal, 
  onDeleteGoal, 
  onAddMilestone, 
  onEditMilestone,
  onDeleteMilestone,
  onToggleMilestone
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Stats calculation
  const total = goal.milestones.length;
  const completed = goal.milestones.filter(m => m.is_completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Days remaining logic
  let daysRemainingText = "No target date";
  let isOverdue = false;
  
  if (goal.target_date) {
    const target = new Date(goal.target_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize
    target.setHours(0, 0, 0, 0);
    
    const diff = differenceInDays(target, today);
    if (diff < 0) {
      daysRemainingText = `${Math.abs(diff)} days overdue`;
      isOverdue = true;
    } else if (diff === 0) {
      daysRemainingText = "Due today";
    } else {
      daysRemainingText = `${diff} days left`;
    }
  }

  const categoryColors: Record<string, string> = {
    'Career': 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    'Health': 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
    'Learning': 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
    'Finance': 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
    'Personal': 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
  };

  return (
    <Card className={`overflow-hidden transition-all ${progress === 100 ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Badge variant="outline" className={`mb-1 ${categoryColors[goal.category] || ''} border-0`}>
              {goal.category}
            </Badge>
            <CardTitle className="text-xl leading-tight">{goal.title}</CardTitle>
            {goal.target_date && (
              <p className={`text-xs font-medium flex items-center gap-1 mt-1 ${isOverdue && progress < 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Target className="h-3 w-3" />
                {daysRemainingText} • {format(new Date(goal.target_date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 h-8 w-8 -mr-2">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditGoal(goal)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddMilestone(goal.id)}>
                <Plus className="mr-2 h-4 w-4" /> Add Milestone
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteGoal(goal.id)} className="text-destructive focus:bg-destructive/10">
                <Trash className="mr-2 h-4 w-4" /> Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {goal.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{goal.description}</p>
        )}
      </CardHeader>

      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">{progress}% Complete</span>
          <span className="text-muted-foreground">{completed} / {total} Milestones</span>
        </div>
        <Progress value={progress} className={`h-2 ${progress === 100 ? '[&>div]:bg-emerald-500' : ''}`} />
      </CardContent>

      <CardFooter className="flex flex-col items-start px-0 pb-0">
        <Button 
          variant="ghost" 
          className="w-full rounded-none rounded-b-lg border-t h-10 text-xs text-muted-foreground flex justify-between px-4 hover:bg-muted/50"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="font-medium text-foreground tracking-wide">MILESTONES ({total})</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {expanded && (
          <div className="w-full bg-muted/10 px-4 py-3 space-y-2 border-t border-border/50">
            {total === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-3">No milestones tracked yet.</p>
                <Button variant="outline" size="sm" onClick={() => onAddMilestone(goal.id)}>
                  <Plus className="mr-2 h-3 w-3" /> Add First Milestone
                </Button>
              </div>
            ) : (
              goal.milestones.map((ms) => (
                <div key={ms.id} className="group flex flex-row items-center justify-between gap-3 bg-background/50 p-2.5 rounded-md border border-border/50 transition-all hover:border-primary/30">
                  <div className="flex items-start gap-3 flex-1 overflow-hidden">
                    <Checkbox 
                      checked={ms.is_completed} 
                      onCheckedChange={(checked) => onToggleMilestone(ms, checked as boolean)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={`text-sm font-medium ${ms.is_completed ? 'line-through text-muted-foreground/60' : 'text-foreground'} truncate block`}>
                        {ms.title}
                      </span>
                      {ms.description && (
                        <span className={`text-xs mt-0.5 line-clamp-1 ${ms.is_completed ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                          {ms.description}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEditMilestone(ms)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDeleteMilestone(ms.id)}>
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            {total > 0 && (
              <Button variant="ghost" size="sm" className="w-full text-xs border-dashed border mt-2 hover:bg-muted" onClick={() => onAddMilestone(goal.id)}>
                <Plus className="mr-1 h-3 w-3" /> Add milestone
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

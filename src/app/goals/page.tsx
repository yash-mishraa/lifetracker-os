"use client";

import { useEffect, useState } from "react";
import { 
  getGoals, 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  addMilestone, 
  updateMilestone, 
  deleteMilestone 
} from "@/lib/services/goal-service";
import { GoalWithMilestones, GoalFormData, MilestoneFormData, Milestone, GoalCategory } from "@/lib/types/goal";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Plus, Target, LayoutGrid, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { GoalsOverview } from "@/components/goals/goals-overview";
import { GoalDialog } from "@/components/goals/goal-dialog";
import { MilestoneDialog } from "@/components/goals/milestone-dialog";
import { GoalCard } from "@/components/goals/goal-card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

const CATEGORIES: GoalCategory[] = ['Career', 'Health', 'Learning', 'Finance', 'Personal'];

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithMilestones[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection / Filter states
  const [activeCategories, setActiveCategories] = useState<Set<GoalCategory>>(new Set(CATEGORIES));

  // Dialog states for Goals
  const [isGoalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithMilestones | null>(null);

  // Dialog states for Milestones
  const [isMilestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [activeGoalIdForMilestone, setActiveGoalIdForMilestone] = useState<string | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (err: any) {
      toast({ title: "Error loading goals", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // ---- GOALS API ----
  const handleOpenGoalDialog = (goal?: GoalWithMilestones) => {
    setEditingGoal(goal || null);
    setGoalDialogOpen(true);
  };

  const handleGoalSubmit = async (formData: GoalFormData) => {
    try {
      if (editingGoal) {
        const updated = await updateGoal(editingGoal.id, formData);
        setGoals(prev => prev.map(g => g.id === updated.id ? { ...updated, milestones: g.milestones } as GoalWithMilestones : g));
        toast({ title: "Goal Updated" });
      } else {
        const created = await createGoal(formData);
        setGoals(prev => [{ ...created, milestones: [] } as GoalWithMilestones, ...prev]);
        toast({ title: "Goal Created" });
      }
    } catch (err: any) {
      toast({ title: "Error saving goal", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({ title: "Goal Deleted" });
    } catch (err: any) {
      toast({ title: "Error deleting goal", description: err.message, variant: "destructive" });
    }
  };

  // ---- MILESTONES API ----
  const handleOpenMilestoneDialog = (goalId: string, milestone?: Milestone) => {
    setActiveGoalIdForMilestone(goalId);
    setEditingMilestone(milestone || null);
    setMilestoneDialogOpen(true);
  };

  const handleMilestoneSubmit = async (formData: MilestoneFormData) => {
    if (!activeGoalIdForMilestone) return;
    
    try {
      if (editingMilestone) {
        const updated = await updateMilestone(editingMilestone.id, formData);
        setGoals(prev => prev.map(g => {
          if (g.id === updated.goal_id) {
            return {
              ...g,
              milestones: g.milestones.map(m => m.id === updated.id ? updated : m)
            };
          }
          return g;
        }));
        toast({ title: "Milestone Updated" });
      } else {
        const created = await addMilestone(activeGoalIdForMilestone, formData);
        setGoals(prev => prev.map(g => {
          if (g.id === activeGoalIdForMilestone) {
            return { ...g, milestones: [...g.milestones, created] };
          }
          return g;
        }));
        toast({ title: "Milestone Added" });
      }
    } catch (err: any) {
      toast({ title: "Error saving milestone", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleMilestone = async (milestone: Milestone, isCompleted: boolean) => {
    try {
      const updated = await updateMilestone(milestone.id, { is_completed: isCompleted });
      // Update local state instantly via map
      setGoals(prev => prev.map(g => {
        if (g.id === milestone.goal_id) {
          return {
            ...g,
            milestones: g.milestones.map(m => m.id === milestone.id ? updated : m)
          };
        }
        return g;
      }));
    } catch (err: any) {
      toast({ title: "Error toggling milestone", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteMilestone = async (id: string, goalId: string) => {
    try {
      await deleteMilestone(id);
      setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
          return { ...g, milestones: g.milestones.filter(m => m.id !== id) };
        }
        return g;
      }));
      toast({ title: "Milestone Deleted" });
    } catch (err: any) {
      toast({ title: "Error deleting milestone", description: err.message, variant: "destructive" });
    }
  };

  const toggleCategoryFilter = (cat: GoalCategory) => {
    const next = new Set(activeCategories);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      next.add(cat);
    }
    setActiveCategories(next);
  };

  const filteredGoals = goals.filter(g => activeCategories.has(g.category));

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Goals & Milestones</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Set long-term objectives and break them down.
            {!isSupabaseConfigured() && (
              <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600 ring-1 ring-inset ring-yellow-500/20">
                Local Storage Mode
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => handleOpenGoalDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center border rounded-xl bg-muted/10">
          <p className="text-muted-foreground animate-pulse">Loading strategy...</p>
        </div>
      ) : (
        <>
          <GoalsOverview goals={goals} />

          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-muted-foreground" />
              Your Strategy
            </h2>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9 px-3">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  Categories
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                    {activeCategories.size}
                  </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
  <DropdownMenuSeparator />
  <DropdownMenuGroup>  {/* 👈 wrap checkbox items */}
    {CATEGORIES.map((cat) => (
      <DropdownMenuCheckboxItem
        key={cat}
        checked={activeCategories.has(cat)}
        onCheckedChange={() => toggleCategoryFilter(cat)}
      >
        {cat}
      </DropdownMenuCheckboxItem>
    ))}
  </DropdownMenuGroup>
</DropdownMenuContent>
            </DropdownMenu>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 mt-8 text-center border rounded-xl bg-muted/20 border-dashed">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No goals found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                You don't have any goals matching the current filters. Start setting your ambitions!
              </p>
              <Button variant="outline" onClick={() => handleOpenGoalDialog()}>Create your first Goal</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  onEditGoal={handleOpenGoalDialog} 
                  onDeleteGoal={handleDeleteGoal} 
                  onAddMilestone={(goalId) => handleOpenMilestoneDialog(goalId)} 
                  onEditMilestone={(ms) => handleOpenMilestoneDialog(goal.id, ms)}
                  onDeleteMilestone={(msId) => handleDeleteMilestone(msId, goal.id)}
                  onToggleMilestone={handleToggleMilestone}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <GoalDialog 
        open={isGoalDialogOpen} 
        onOpenChange={setGoalDialogOpen} 
        goal={editingGoal} 
        onSubmit={handleGoalSubmit} 
      />
      
      <MilestoneDialog 
        open={isMilestoneDialogOpen} 
        onOpenChange={setMilestoneDialogOpen} 
        milestone={editingMilestone} 
        onSubmit={handleMilestoneSubmit} 
      />
    </div>
  );
}

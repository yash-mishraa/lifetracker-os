"use client";

import { useEffect, useState } from "react";
import { WeeklyMetricsSummary } from "@/components/review/weekly-metrics-summary";
import { ReflectionForm } from "@/components/review/reflection-form";
import { PastReviewsList } from "@/components/review/past-reviews-list";
import { 
  getWeeklyMetricsSnapshot, 
  getWeeklyReviews, 
  getReviewForWeek, 
  saveWeeklyReview 
} from "@/lib/services/review-service";
import { WeeklyReview, WeeklyReviewMetrics, WeeklyReviewFormData } from "@/lib/types/review";
import { useToast } from "@/components/ui/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function WeeklyReviewPage() {
  const [currentMetrics, setCurrentMetrics] = useState<WeeklyReviewMetrics | null>(null);
  const [currentReview, setCurrentReview] = useState<WeeklyReview | null>(null);
  const [pastReviews, setPastReviews] = useState<WeeklyReview[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  // We use today's date to determine the "current" week to review
  const today = new Date();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Calculate live metrics snapshot for this week
      const metrics = await getWeeklyMetricsSnapshot(today);
      setCurrentMetrics(metrics);

      // 2. See if the user already started/saved a review for this week
      const existingThisWeek = await getReviewForWeek(today);
      setCurrentReview(existingThisWeek);

      // 3. Load all past history
      let history = await getWeeklyReviews();
      
      // Filter out the current week from the "past history" list if it exists, 
      // so it doesn't double-render at the bottom while editing at the top.
      if (existingThisWeek) {
         history = history.filter(r => r.id !== existingThisWeek.id);
      }
      setPastReviews(history);
      
    } catch (err: any) {
      toast({ title: "Error loading weekly review", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleSaveReview = async (formData: WeeklyReviewFormData) => {
    if (!currentMetrics) return;
    
    setSaving(true);
    try {
      // Save it (this will update if one already exists for the week)
      await saveWeeklyReview(formData, currentMetrics, today);
      
      toast({ 
        title: "Weekly Review Saved!", 
        description: "Your reflection and progress snapshot have been successfully recorded." 
      });
      
      // Reload to place the newly saved item contextually
      await loadData();
    } catch (err: any) {
      toast({ title: "Error saving review", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Weekly Review</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Reflect on your progress and plan ahead.
            {!isSupabaseConfigured() && (
              <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600 ring-1 ring-inset ring-yellow-500/20">
                Local Storage Mode
              </span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center border rounded-xl bg-muted/10">
          <p className="text-muted-foreground animate-pulse">Loading this week's data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {currentMetrics && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <WeeklyMetricsSummary 
                metrics={currentMetrics} 
                dateInWeek={today} 
              />
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <ReflectionForm 
              initialData={currentReview || undefined}
              onSubmit={handleSaveReview}
              isSubmitting={saving}
            />
          </div>

          <div className="pt-8 border-t border-border/40">
            <h2 className="text-xl font-semibold mb-4 tracking-tight">Review History</h2>
            <PastReviewsList reviews={pastReviews} />
          </div>

        </div>
      )}
    </div>
  );
}

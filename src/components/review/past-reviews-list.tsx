"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WeeklyReview } from "@/lib/types/review";
import { CalendarDays, CheckCircle2, Flame, Moon, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface PastReviewsListProps {
  reviews: WeeklyReview[];
}

export function PastReviewsList({ reviews }: PastReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <Card className="border-dashed bg-muted/10">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <CalendarDays className="h-10 w-10 mb-4 opacity-30" />
          <p>No past reviews found.</p>
          <p className="text-sm mt-1">Your saved reflections will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Past Reflections</CardTitle>
        <CardDescription>Look back at your previous weeks and tracked progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {reviews.map((review) => {
            const start = parseISO(review.week_start_date);
            const end = parseISO(review.week_end_date);
            const label = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
            
            return (
              <AccordionItem key={review.id} value={review.id} className="border-b last:border-0 pl-1 pr-1">
                <AccordionTrigger className="hover:no-underline hover:text-primary transition-colors py-4">
                  <div className="flex flex-col items-start gap-1 text-left">
                    <span className="font-semibold text-base">{label}</span>
                    <span className="text-xs text-muted-foreground font-normal line-clamp-1 max-w-sm">
                      {review.went_well || "No reflection written."}
                    </span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-2 pb-6 space-y-6">
                  {/* Historical Metrics Snapshot */}
                  <div className="bg-muted/30 p-4 rounded-xl flex flex-wrap gap-4 sm:gap-6 lg:gap-8 justify-between text-sm shadow-inner border border-border/50">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-blue-500"/> Tasks</span>
                      <span className="font-bold text-lg">{review.metrics.tasks_completed}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1 flex items-center gap-1.5"><Flame className="h-3 w-3 text-orange-500"/> Habits</span>
                      <span className="font-bold text-lg">{review.metrics.habits_completed}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1 flex items-center gap-1.5"><Moon className="h-3 w-3 text-indigo-500"/> Sleep</span>
                      <span className="font-bold text-lg">{review.metrics.average_sleep} hrs</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground mb-1 flex items-center gap-1.5"><Clock className="h-3 w-3 text-emerald-500"/> Focus</span>
                      <span className="font-bold text-lg">{review.metrics.total_focus_hours} hrs</span>
                    </div>
                  </div>

                  {/* Qualitative Answers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {review.went_well && (
                      <div>
                        <h4 className="font-medium text-sm text-primary/80 mb-1">🌟 What went well</h4>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.went_well}</p>
                      </div>
                    )}
                    {review.could_improve && (
                      <div>
                        <h4 className="font-medium text-sm text-destructive/80 mb-1">📉 Could improve</h4>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.could_improve}</p>
                      </div>
                    )}
                    
                    {/* Full width for achievement */}
                    {review.biggest_achievement && (
                      <div className="md:col-span-2">
                         <h4 className="font-medium text-sm text-amber-500 mb-1">🏆 Biggest Achievement</h4>
                         <p className="text-sm text-foreground/90 whitespace-pre-wrap font-medium">{review.biggest_achievement}</p>
                      </div>
                    )}

                    {review.habits_maintained && (
                      <div>
                        <h4 className="font-medium text-sm text-emerald-500 mb-1">✅ Maintained</h4>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.habits_maintained}</p>
                      </div>
                    )}
                    {review.habits_missed && (
                      <div>
                        <h4 className="font-medium text-sm text-rose-500 mb-1">❌ Missed</h4>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.habits_missed}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

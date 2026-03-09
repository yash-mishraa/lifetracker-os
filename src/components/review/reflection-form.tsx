"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WeeklyReviewFormData } from "@/lib/types/review";
import { Save } from "lucide-react";

interface ReflectionFormProps {
  initialData?: Partial<WeeklyReviewFormData>;
  onSubmit: (data: WeeklyReviewFormData) => Promise<void>;
  isSubmitting: boolean;
}

const DEFAULT_FORM: WeeklyReviewFormData = {
  went_well: "",
  could_improve: "",
  biggest_achievement: "",
  habits_maintained: "",
  habits_missed: ""
};

export function ReflectionForm({ initialData, onSubmit, isSubmitting }: ReflectionFormProps) {
  const [formData, setFormData] = useState<WeeklyReviewFormData>(DEFAULT_FORM);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: keyof WeeklyReviewFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Self-Reflection</CardTitle>
          <CardDescription>Take a moment to write down your thoughts on how the week went.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              🌟 What went well this week?
            </label>
            <Textarea 
              placeholder="I finished the big project and worked out 3 times..."
              className="resize-none min-h-[100px]"
              value={formData.went_well}
              onChange={(e) => handleChange('went_well', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              📉 What could improve?
            </label>
            <Textarea 
              placeholder="I slept very poorly on Wednesday and skipped my reading habit..."
              className="resize-none min-h-[100px]"
              value={formData.could_improve}
              onChange={(e) => handleChange('could_improve', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              🏆 Biggest Achievement
            </label>
            <Textarea 
              placeholder="Finally launching my new app!"
              className="resize-none min-h-[80px]"
              value={formData.biggest_achievement}
              onChange={(e) => handleChange('biggest_achievement', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                ✅ Habits Maintained
              </label>
              <Textarea 
                placeholder="Morning meditation, Coding"
                className="resize-none min-h-[80px]"
                value={formData.habits_maintained}
                onChange={(e) => handleChange('habits_maintained', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                ❌ Habits Missed
              </label>
              <Textarea 
                placeholder="Reading, Drinking water"
                className="resize-none min-h-[80px]"
                value={formData.habits_missed}
                onChange={(e) => handleChange('habits_missed', e.target.value)}
              />
            </div>
          </div>

        </CardContent>
        <CardFooter className="bg-muted/30 pt-4 rounded-b-xl border-t">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Saving...</span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Weekly Review</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

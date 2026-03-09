import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AchievementBadge } from "@/lib/types/gamification";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, Trophy, CheckCircle, Brain, Calendar } from "lucide-react";

interface AchievementsGridProps {
  achievements: AchievementBadge[];
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  // Map icon strings to actual Lucide components
  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "Flame": return <Flame className={className} />;
      case "Calendar": return <Calendar className={className} />;
      case "CheckCircle": return <CheckCircle className={className} />;
      case "Brain": return <Brain className={className} />;
      case "Target": return <Target className={className} />;
      default: return <Trophy className={className} />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
               <Trophy className="h-5 w-5 text-yellow-500" /> Trophies
            </CardTitle>
            <CardDescription>Badges earned from your consistency</CardDescription>
          </div>
          <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {achievements.filter(a => a.isUnlocked).length} / {achievements.length} Unlocked
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {achievements.map(badge => {
            const isUnlocked = badge.isUnlocked;

            return (
              <div 
                key={badge.id}
                className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all ${
                  isUnlocked 
                    ? `bg-card hover:-translate-y-1 hover:shadow-md ${badge.colorClass.split(' ')[2]}` // Use the border color from colorClass
                    : "bg-muted/30 border-dashed opacity-60 grayscale hover:grayscale-0"
                }`}
              >
                {/* Icon Circle */}
                <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-3 ${isUnlocked ? badge.colorClass.split(' ')[1] : 'bg-muted max-w-[56px] min-h-[56px]'}`}>
                   {getIcon(badge.icon, `h-7 w-7 ${isUnlocked ? badge.colorClass.split(' ')[0] : 'text-muted-foreground'}`)}
                </div>

                {/* Text */}
                <h4 className="font-semibold text-sm mb-1 leading-tight">{badge.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 h-8">{badge.description}</p>

                {/* Progress Bar (if locked) */}
                {!isUnlocked && badge.totalRequired && (
                   <div className="w-full mt-3 space-y-1">
                     <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                        <span>{badge.progress || 0}</span>
                        <span>{badge.totalRequired}</span>
                     </div>
                     <Progress 
                        value={((badge.progress || 0) / badge.totalRequired) * 100} 
                        className="h-1.5"
                     />
                   </div>
                )}

                {/* Unlocked Date badge overlay */}
                {isUnlocked && (
                  <div className="absolute -top-2 -right-2 bg-background rounded-full border shadow-sm p-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import { AppNotification } from "@/lib/types/notification";
import { CheckSquare, Flame, HeartPulse, Target, Clock } from "lucide-react";
import Link from "next/link";

interface ReminderItemProps {
  notification: AppNotification;
  onClose: () => void;
}

export function ReminderItem({ notification, onClose }: ReminderItemProps) {
  
  const getIcon = () => {
    switch (notification.type) {
      case "task": return <CheckSquare className="h-4 w-4 text-blue-500" />;
      case "habit": return <Flame className="h-4 w-4 text-orange-500" />;
      case "health": return <HeartPulse className="h-4 w-4 text-emerald-500" />;
      case "goal": return <Target className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case "task": return "bg-blue-500/10";
      case "habit": return "bg-orange-500/10";
      case "health": return "bg-emerald-500/10";
      case "goal": return "bg-yellow-500/10";
    }
  };

  return (
    <Link 
       href={notification.actionUrl} 
       onClick={onClose}
       className="block hover:bg-muted/50 transition-colors border-b last:border-0"
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getBgColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium leading-none">{notification.title}</p>
            {notification.time && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium bg-muted px-1.5 py-0.5 rounded">
                <Clock className="h-3 w-3" />
                {notification.time}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
        </div>
      </div>
    </Link>
  );
}

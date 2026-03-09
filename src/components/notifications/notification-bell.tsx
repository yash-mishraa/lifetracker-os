"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { AppNotification } from "@/lib/types/notification";
import { getPendingReminders } from "@/lib/services/notification-service";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReminderItem } from "@/components/notifications/reminder-item";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchReminders();

    // Set up a simple polling interval (every 1 minute) to check for new reminders 
    // (e.g., when a habit reminder time passes)
    const interval = setInterval(() => {
      fetchReminders();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Also fetch when popover is opened to ensure freshest data
  useEffect(() => {
    if (isOpen) {
      fetchReminders();
    }
  }, [isOpen]);

  async function fetchReminders() {
    try {
      const data = await getPendingReminders();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-background"></span>
            </span>
          )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] sm:w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold leading-none flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h4>
          {notifications.length > 0 && (
            <Button 
               variant="ghost" 
               className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
               onClick={() => setNotifications([])} // Simple "clear all" logic for now
            >
              Clear
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-auto max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">You're all caught up!</p>
              <p className="text-xs mt-1 opacity-70">No pending reminders right now.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <ReminderItem 
                  key={notification.id} 
                  notification={notification} 
                  onClose={() => setIsOpen(false)} 
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

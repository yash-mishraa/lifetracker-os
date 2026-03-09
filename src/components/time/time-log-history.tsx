"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash, Timer, Clock } from "lucide-react";
import { TimeLog } from "@/lib/types/time";
import { Task } from "@/lib/types";
import { format, isToday, isYesterday } from "date-fns";

interface TimeLogHistoryProps {
  logs: TimeLog[];
  tasks: Task[];
  onDeleteLog: (id: string) => Promise<void>;
}

export function TimeLogHistory({ logs, tasks, onDeleteLog }: TimeLogHistoryProps) {
  
  // Helper to resolve task name
  const getTaskName = (taskId?: string | null) => {
    if (!taskId) return "General Tracking";
    const t = tasks.find(t => t.id === taskId);
    return t ? t.title : "Deleted Task";
  };

  const getProjectName = (taskId?: string | null) => {
    if (!taskId) return null;
    const t = tasks.find(t => t.id === taskId);
    return t ? t.project : null;
  };

  // Helper to format duration
  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Helper to format date nicely
  const formatDateFriendly = (isoString: string) => {
    const d = new Date(isoString);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
            <CardDescription>Your logged focus blocks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full text-muted-foreground">
            <Clock className="h-8 w-8 mb-4 opacity-50" />
            <p>No time logged yet.</p>
            <p className="text-sm">Start a timer to record your focus sessions.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const project = getProjectName(log.task_id);
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground align-top pt-4">
                      {formatDateFriendly(log.start_time)}
                      <br />
                      <span className="text-[10px] opacity-70">{format(new Date(log.start_time), "h:mm a")}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm line-clamp-1">{getTaskName(log.task_id)}</div>
                      {project && (
                        <div className="text-xs text-muted-foreground mt-0.5">{project}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.timer_type === 'Pomodoro' ? 'default' : 'secondary'} className="text-[10px] font-normal px-2">
                        {log.timer_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatDuration(log.duration_seconds)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteLog(log.id)}
                        title="Delete session"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

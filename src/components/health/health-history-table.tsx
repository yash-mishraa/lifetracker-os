"use client";

import { HealthLog } from "@/lib/types/health";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HealthHistoryTableProps {
  logs: HealthLog[];
  onEdit: (log: HealthLog) => void;
  onDelete: (id: string) => void;
}

export function HealthHistoryTable({ logs, onEdit, onDelete }: HealthHistoryTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No historical data found.</p>
      </div>
    );
  }

  // Define mood colors
  const getMoodBadge = (mood: string | null) => {
    if (!mood) return <span className="text-muted-foreground">-</span>;
    switch (mood) {
      case "Very happy": return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10">Very happy</Badge>;
      case "Happy": return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">Happy</Badge>;
      case "Neutral": return <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10">Neutral</Badge>;
      case "Stressed": return <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10">Stressed</Badge>;
      case "Sad": return <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">Sad</Badge>;
      default: return <Badge variant="outline">{mood}</Badge>;
    }
  };

  // Sort descending (newest first)
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Sleep</TableHead>
              <TableHead>Water</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Steps</TableHead>
              <TableHead>Workout</TableHead>
              <TableHead>Mood</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {format(parseISO(log.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{log.sleep_hours ? `${log.sleep_hours}h` : '-'}</TableCell>
                <TableCell>{log.water_intake || '-'}</TableCell>
                <TableCell>{log.weight ? `${log.weight} kg` : '-'}</TableCell>
                <TableCell>{log.steps ? log.steps.toLocaleString() : '-'}</TableCell>
                <TableCell>
                  {log.workout_done ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Check className="h-4 w-4" /> 
                      <span className="text-xs max-w-[100px] truncate" title={log.workout_details}>{log.workout_details || "Yes"}</span>
                    </div>
                  ) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>{getMoodBadge(log.mood)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(log)} className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(log.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

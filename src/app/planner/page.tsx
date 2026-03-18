// /*"use client";

// import { useEffect, useState, useCallback } from "react";
// import { DailyTimeline } from "@/components/planner/daily-timeline";
// import { getScheduleForDate, saveScheduleForDate } from "@/lib/services/planner-service";
// import { TimeBlock, BlockType, EnergyLevel } from "@/lib/types/planner";
// import { updateTask } from "@/lib/services/task-service";
// import { Button } from "@/components/ui/button";
// import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
// } from "@/components/ui/dialog";
// import {
//   AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
//   AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from "@/components/ui/select";
// import {
//   format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
//   addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
// } from "date-fns";

// function generateId() {
//   return typeof crypto !== "undefined" && crypto.randomUUID
//     ? crypto.randomUUID()
//     : Math.random().toString(36).substring(2, 15);
// }

// const EMPTY_FORM = {
//   title: "", description: "", startTime: "09:00", endTime: "10:00",
//   type: "task" as BlockType, energyLevel: "Medium" as EnergyLevel, isLocked: false,
// };

// // ─── Mini Calendar ────────────────────────────────────────────────────────────

// interface MiniCalendarProps {
//   selected: Date;
//   onSelect: (date: Date) => void;
//   scheduledDates: Set<string>;
// }

// function MiniCalendar({ selected, onSelect, scheduledDates }: MiniCalendarProps) {
//   const [viewMonth, setViewMonth] = useState(startOfMonth(selected));

//   const weeks: Date[][] = [];
//   const monthStart = startOfMonth(viewMonth);
//   const monthEnd = endOfMonth(viewMonth);
//   const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
//   const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

//   let day = calStart;
//   while (day <= calEnd) {
//     const week: Date[] = [];
//     for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1); }
//     weeks.push(week);
//   }

//   return (
//     <div className="select-none">
//       {/* Month nav */}/*
//       <div className="flex items-center justify-between mb-4">
//         <button
//           onClick={() => setViewMonth(subMonths(viewMonth, 1))}
//           className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
//         >
//           <ChevronLeft className="h-4 w-4 text-muted-foreground" />
//         </button>
//         <span className="text-sm font-semibold tracking-tight">
//           {format(viewMonth, "MMMM yyyy")}
//         </span>
//         <button
//           onClick={() => setViewMonth(addMonths(viewMonth, 1))}
//           className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
//         >
//           <ChevronRight className="h-4 w-4 text-muted-foreground" />
//         </button>
//       </div>

//       {/* Day headers */}/*
//       <div className="grid grid-cols-7 mb-1">
//         {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
//           <div key={i} className="text-center text-[10px] font-medium text-muted-foreground/60 py-1">
//             {d}
//           </div>
//         ))}
//       </div>

//       {/* Days grid */}/*
//       <div className="grid grid-cols-7 gap-y-0.5">
//         {weeks.flat().map((d, i) => {
//           const dateStr = format(d, "yyyy-MM-dd");
//           const isSelected = isSameDay(d, selected);
//           const isCurrentMonth = isSameMonth(d, viewMonth);
//           const isTodayDate = isToday(d);
//           const hasBlocks = scheduledDates.has(dateStr);

//           return (
//             <button
//               key={i}
//               onClick={() => onSelect(d)}
//               className={[
//                 "relative h-8 w-full flex items-center justify-center rounded-full text-xs font-medium transition-all",
//                 !isCurrentMonth && "opacity-25",
//                 isSelected
//                   ? "bg-foreground text-background"
//                   : isTodayDate
//                   ? "text-indigo-500 font-bold"
//                   : "hover:bg-muted/60 text-foreground",
//               ].filter(Boolean).join(" ")}
//             >
//               {format(d, "d")}
//               {hasBlocks && !isSelected && (
//                 <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-indigo-400" />
//               )}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default function PlannerPage() {
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [schedule, setSchedule] = useState<TimeBlock[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showDialog, setShowDialog] = useState(false);
//   const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
//   const [deleteId, setDeleteId] = useState<string | null>(null);
//   const [form, setForm] = useState(EMPTY_FORM);
//   const [scheduledDates, setScheduledDates] = useState<Set<string>>(new Set());
//   const { toast } = useToast();

//   const loadSchedule = useCallback(async (date: Date) => {
//     setLoading(true);
//     try {
//       const blocks = await getScheduleForDate(date);
//       setSchedule(blocks);
//     } catch (err: any) {
//       toast({ title: "Failed to load schedule", description: err.message, variant: "destructive" });
//     } finally {
//       setLoading(false);
//     }
//   }, [toast]);

//   useEffect(() => { loadSchedule(selectedDate); }, [selectedDate, loadSchedule]);

//   // Track which dates have blocks (for calendar dots)
//   useEffect(() => {
//     if (schedule.length > 0) {
//       setScheduledDates(prev => new Set([...prev, format(selectedDate, "yyyy-MM-dd")]));
//     }
//   }, [schedule, selectedDate]);

//   async function persistSchedule(blocks: TimeBlock[], date: Date = selectedDate) {
//     setSchedule(blocks);
//     try {
//       await saveScheduleForDate(date, blocks);
//       if (blocks.length > 0) {
//         setScheduledDates(prev => new Set([...prev, format(date, "yyyy-MM-dd")]));
//       }
//     } catch (err) {
//       console.error("Failed to save schedule", err);
//     }
//   }

//   function openAdd() {
//     setEditingBlock(null);
//     setForm(EMPTY_FORM);
//     setShowDialog(true);
//   }

//   function openEdit(block: TimeBlock) {
//     setEditingBlock(block);
//     setForm({
//       title: block.title, description: block.description ?? "",
//       startTime: block.startTime, endTime: block.endTime,
//       type: block.type, energyLevel: block.energyLevel ?? "Medium",
//       isLocked: block.isLocked ?? false,
//     });
//     setShowDialog(true);
//   }

//   async function handleSave() {
//     if (!form.title.trim()) {
//       toast({ title: "Title is required", variant: "destructive" });
//       return;
//     }
//     if (editingBlock) {
//       await persistSchedule(schedule.map(b =>
//         b.id === editingBlock.id ? { ...b, ...form, description: form.description || undefined } : b
//       ));
//       toast({ title: "Block updated." });
//     } else {
//       const block: TimeBlock = {
//         id: generateId(), ...form,
//         description: form.description || undefined, isCompleted: false,
//       };
//       await persistSchedule([...schedule, block]);
//       toast({ title: "Block added." });
//     }
//     setShowDialog(false);
//   }

//   async function handleDelete(id: string) {
//     await persistSchedule(schedule.filter(b => b.id !== id));
//     setDeleteId(null);
//     toast({ title: "Block removed." });
//   }

//   async function handleToggleComplete(id: string, isCompleted: boolean) {
//     const updated = schedule.map(b => b.id === id ? { ...b, isCompleted } : b);
//     setSchedule(updated);
//     const block = schedule.find(b => b.id === id);
//     if (block?.sourceId && block.type === "task") {
//       try {
//         await updateTask(block.sourceId, { status: isCompleted ? "completed" : "todo" });
//       } catch (err: any) {
//         toast({ title: "Action failed", description: err.message, variant: "destructive" });
//         setSchedule(schedule);
//         return;
//       }
//     }
//     try { await saveScheduleForDate(selectedDate, updated); } catch {}
//     if (isCompleted) toast({ title: "Marked as complete!" });
//   }

//   const isSelectedToday = isToday(selectedDate);
//   const dateLabel = isSelectedToday
//     ? "Today"
//     : format(selectedDate, "EEEE, MMMM d");

//   return (
//     <div className="p-6 md:p-10 max-w-7xl mx-auto">
//       {/* Header */}/*
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6 mb-8">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
//             Planner
//           </h1>
//           <p className="text-sm text-muted-foreground mt-1">Plan your days, block by block.</p>
//         </div>
//         <Button
//           onClick={openAdd}
//           disabled={loading}
//           className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
//         >
//           <Plus className="mr-2 h-4 w-4" />
//           Add Block
//         </Button>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
//         {/* ── Left: Calendar + legend ── */}/*
//         <div className="space-y-5">
//           {/* Calendar card */}/*
//           <div className="bg-card border rounded-2xl p-5 shadow-sm">
//             <MiniCalendar
//               selected={selectedDate}
//               onSelect={setSelectedDate}
//               scheduledDates={scheduledDates}
//             />
//           </div>

//           {/* Quick-jump */}/*
//           {!isSelectedToday && (
//             <button
//               onClick={() => setSelectedDate(new Date())}
//               className="w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1"
//             >
//               Jump to today
//             </button>
//           )}

//           {/* Legend */}/*
//           <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-3">
//             <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Block types</p>
//             {[
//               { color: "bg-blue-500", label: "Task" },
//               { color: "bg-orange-500", label: "Habit" },
//               { color: "bg-purple-500", label: "Focus" },
//               { color: "bg-green-500", label: "Break" },
//             ].map(({ color, label }) => (
//               <div key={label} className="flex items-center gap-2.5">
//                 <span className={`h-2 w-2 rounded-full ${color}`} />
//                 <span className="text-xs text-muted-foreground">{label}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ── Right: Timeline ── */}/*
//         <div className="bg-card/30 border rounded-2xl p-6 shadow-sm min-h-[500px]">
//           {/* Day header */}/*
//           <div className="flex items-center justify-between mb-6 pb-4 border-b">
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setSelectedDate(d => addDays(d, -1))}
//                 className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
//               >
//                 <ChevronLeft className="h-4 w-4 text-muted-foreground" />
//               </button>
//               <div>
//                 <h2 className="text-lg font-semibold leading-tight">{dateLabel}</h2>
//                 {!isSelectedToday && (
//                   <p className="text-xs text-muted-foreground">{format(selectedDate, "yyyy")}</p>
//                 )}
//               </div>
//               <button
//                 onClick={() => setSelectedDate(d => addDays(d, 1))}
//                 className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
//               >
//                 <ChevronRight className="h-4 w-4 text-muted-foreground" />
//               </button>
//             </div>
//             <span className="text-xs text-muted-foreground">
//               {schedule.length} {schedule.length === 1 ? "block" : "blocks"}
//             </span>
//           </div>

//           {loading ? (
//             <div className="space-y-4">
//               {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
//             </div>
//           ) : schedule.length === 0 ? (
//             <div className="h-[300px] flex flex-col items-center justify-center text-center gap-3 border border-dashed rounded-xl bg-muted/10">
//               <p className="text-sm text-muted-foreground">
//                 {isSelectedToday ? "Nothing planned for today." : `Nothing planned for ${format(selectedDate, "MMM d")}.`}
//               </p>
//               <Button onClick={openAdd} variant="outline" size="sm">
//                 <Plus className="mr-1 h-3 w-3" /> Add first block
//               </Button>
//             </div>
//           ) : (
//             <DailyTimeline
//               initialBlocks={schedule}
//               onScheduleChange={(blocks) => persistSchedule(blocks)}
//               onToggleComplete={handleToggleComplete}
//               onEdit={openEdit}
//               onDelete={(id) => setDeleteId(id)}
//             />
//           )}
//         </div>
//       </div>

//       {/* Add / Edit Dialog */}/*
//       <Dialog open={showDialog} onOpenChange={setShowDialog}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle>{editingBlock ? "Edit Block" : "Add Block"}</DialogTitle>
//             <p className="text-xs text-muted-foreground pt-1">{format(selectedDate, "EEEE, MMMM d")}</p>
//           </DialogHeader>
//           <div className="space-y-4 py-1">
//             <div className="space-y-1.5">
//               <Label>Title</Label>
//               <Input
//                 placeholder="e.g. Deep work session"
//                 value={form.title}
//                 onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
//                 onKeyDown={e => e.key === "Enter" && handleSave()}
//               />
//             </div>
//             <div className="space-y-1.5">
//               <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
//               <Textarea
//                 placeholder="Add notes..."
//                 rows={2}
//                 value={form.description}
//                 onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
//               />
//             </div>
//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1.5">
//                 <Label>Start</Label>
//                 <Input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label>End</Label>
//                 <Input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
//               </div>
//             </div>
//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1.5">
//                 <Label>Type</Label>
//                 <Select value={form.type} onValueChange={val => setForm(p => ({ ...p, type: val as BlockType }))}>
//                   <SelectTrigger><SelectValue /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="task">Task</SelectItem>
//                     <SelectItem value="habit">Habit</SelectItem>
//                     <SelectItem value="focus">Focus</SelectItem>
//                     <SelectItem value="break">Break</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-1.5">
//                 <Label>Energy</Label>
//                 <Select value={form.energyLevel} onValueChange={val => setForm(p => ({ ...p, energyLevel: val as EnergyLevel }))}>
//                   <SelectTrigger><SelectValue /></SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="High">High</SelectItem>
//                     <SelectItem value="Medium">Medium</SelectItem>
//                     <SelectItem value="Low">Low</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
//             <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
//               {editingBlock ? "Save Changes" : "Add Block"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation */}/*
//       <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Remove this block?</AlertDialogTitle>
//             <AlertDialogDescription>This will remove the block from {isSelectedToday ? "today's" : format(selectedDate, "MMM d's")} schedule.</AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               className="bg-red-600 hover:bg-red-700 text-white"
//               onClick={() => deleteId && handleDelete(deleteId)}
//             >
//               Remove
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }

import { redirect } from "next/navigation";
export default function Page() { redirect("/plan"); }
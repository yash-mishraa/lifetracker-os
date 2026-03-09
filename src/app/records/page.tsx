"use client";

import { useEffect, useState } from "react";
import { PersonalRecord } from "@/lib/types/records";
import { getPersonalRecords } from "@/lib/services/records-service";
import { RecordCard } from "@/components/records/record-card";
import { Trophy, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function RecordsPage() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadRecords() {
      try {
        setLoading(true);
        const data = await getPersonalRecords();
        setRecords(data);
      } catch (err: any) {
        toast({ title: "Failed to load records", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, [toast]);

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Personal Records</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          Track your all-time highest streaks and best productivity days.
          <Trophy className="h-4 w-4 text-amber-500" />
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { LifeBalanceChart } from "./life-balance-chart";
import { LifeBalanceData } from "@/lib/types/life-balance";
import { getLifeBalanceData } from "@/lib/services/life-balance-service";
import { useToast } from "@/components/ui/use-toast";

export function LifeBalanceSection() {
  const [data, setData] = useState<LifeBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchBalance() {
      try {
        setLoading(true);
        const result = await getLifeBalanceData();
        setData(result);
      } catch (error) {
        console.error("Failed to load life balance:", error);
        toast({
          title: "Failed to load balance",
          description: "Could not fetch life balance data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [toast]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground">Life Balance</h3>
        <p className="text-sm text-muted-foreground">
          Your estimated score across 6 key areas over the last 30 days.
        </p>
      </div>
      
      <div className="w-full max-w-4xl pt-2">
        <LifeBalanceChart data={data} isLoading={loading} />
      </div>
    </div>
  );
}

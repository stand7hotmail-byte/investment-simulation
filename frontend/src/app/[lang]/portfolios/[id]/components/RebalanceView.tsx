"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { 
  Loader2, 
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface RebalanceViewProps {
  portfolioId: string;
  allocations: any[];
}

interface RebalanceResponse {
  diff: Record<string, number>;
}

export function RebalanceView({ portfolioId, allocations }: RebalanceViewProps) {
  // For now, we compare current against an "Ideal" balanced state
  // In a real app, target_weights would come from a user preference or a model
  const targetWeights = allocations.reduce((acc, a) => {
    acc[a.asset_code] = 1.0 / allocations.length; // Simple equal weight target for demo
    return acc;
  }, {} as Record<string, number>);

  const { data: rebalanceData, isLoading } = useQuery<RebalanceResponse>({
    queryKey: ["rebalance", portfolioId, targetWeights],
    queryFn: () => fetchApi(`/api/portfolios/${portfolioId}/analytics/rebalance`, {
      method: "POST",
      body: JSON.stringify({ target_weights: targetWeights })
    }),
  });

  if (isLoading) {
    return <div className="flex h-32 items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const diffs = rebalanceData?.diff || {};
  const needsRebalance = Object.values(diffs).some((v: any) => Math.abs(v) > 0.05);

  return (
    <div className="space-y-6">
      <Card className={cn(
        "border-l-4",
        needsRebalance ? "border-l-amber-500" : "border-l-emerald-500"
      )}>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className={cn(
            "p-2 rounded-full",
            needsRebalance ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
          )}>
            {needsRebalance ? <AlertCircle /> : <CheckCircle2 />}
          </div>
          <div>
            <CardTitle>{needsRebalance ? "Rebalancing Recommended" : "Portfolio Well Balanced"}</CardTitle>
            <CardDescription>
              Comparing your current weights to the target allocation.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {allocations.map((alloc) => {
          const diff = diffs[alloc.asset_code] || 0;
          const isOver = diff < 0;
          return (
            <Card key={alloc.asset_code}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">{alloc.asset_code}</div>
                  <div className={cn(
                    "text-sm font-bold",
                    diff > 0 ? "text-emerald-600" : diff < 0 ? "text-rose-600" : "text-slate-400"
                  )}>
                    {diff > 0 ? "+" : ""}{(diff * 100).toFixed(1)}% {diff !== 0 && (diff > 0 ? "Buy" : "Sell")}
                  </div>
                </div>
                <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                  {/* Current */}
                  <div 
                    className="absolute h-full bg-slate-300" 
                    style={{ width: `${alloc.weight * 100}%` }}
                  />
                  {/* Target Marker */}
                  <div 
                    className="absolute h-full w-1 bg-primary z-10" 
                    style={{ left: `${targetWeights[alloc.asset_code] * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground uppercase font-bold">
                  <span>Current: {(alloc.weight * 100).toFixed(1)}%</span>
                  <span>Target: {(targetWeights[alloc.asset_code] * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Helper for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

"use client";

import { useSimulationStore } from "@/store/useSimulationStore";
import { useAssets } from "@/hooks/useAssets";
import { FrontierPoint } from "@/types/simulation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, MousePointer2 } from "lucide-react";

export function AllocationTable() {
  const selectedPoint = useSimulationStore((state) => state.selectedPoint);
  const riskParityPoint = useSimulationStore((state) => state.riskParityPoint);
  const maxSharpePoint = useSimulationStore((state) => state.maxSharpePoint);
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);
  const { data: assets } = useAssets();

  if (!selectedPoint) {
    return null;
  }

  const isMatch = (p1: FrontierPoint | null, p2: FrontierPoint) => {
    if (!p1) return false;
    return Math.abs(p1.volatility - p2.volatility) < 1e-6 && 
           Math.abs(p1.expected_return - p2.expected_return) < 1e-6;
  };

  let strategyName = "Custom Selection";
  if (isMatch(riskParityPoint, selectedPoint)) {
    strategyName = "Risk Parity Strategy (ERC)";
  } else if (isMatch(maxSharpePoint, selectedPoint)) {
    strategyName = "Maximum Sharpe Ratio Strategy";
  } else if (selectedPoint.expected_return > 0) {
    strategyName = "Efficient Frontier Optimized Point";
  }

  const getAssetName = (code: string) => {
    const asset = assets?.find((a) => a.asset_code === code);
    return asset ? asset.name : code;
  };

  const weights = Object.entries(selectedPoint.weights)
    .filter(([_, weight]) => weight > 0.0001)
    .sort(([_, a], [__, b]) => b - a);

  return (
    <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Quick Strategy Selector */}
      <div className="flex flex-wrap gap-2">
        {riskParityPoint && (
          <Button 
            variant={isMatch(riskParityPoint, selectedPoint) ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPoint(riskParityPoint)}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Risk Parity
          </Button>
        )}
        {maxSharpePoint && (
          <Button 
            variant={isMatch(maxSharpePoint, selectedPoint) ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPoint(maxSharpePoint)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Max Sharpe
          </Button>
        )}
        <div className="flex-1" />
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 italic">
          <MousePointer2 className="w-3 h-3" />
          Click chart points to select other portfolios
        </div>
      </div>

      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">
            {strategyName}
          </div>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>Asset Allocation Details</span>
            <div className="flex space-x-4 text-sm font-normal text-slate-500">
              <span>Risk: {(selectedPoint.volatility * 100).toFixed(2)}%</span>
              <span>Return: {(selectedPoint.expected_return * 100).toFixed(2)}%</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead className="text-right">Allocation (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weights.map(([code, weight]) => (
                <TableRow key={code} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium">{getAssetName(code)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(weight * 100).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

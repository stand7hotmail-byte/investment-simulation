"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EfficientFrontierChart } from "@/components/simulation/EfficientFrontierChart";
import { AllocationTable } from "@/components/simulation/AllocationTable";
import { TrendingUp } from "lucide-react";
import { EfficientFrontierResponse, FrontierPoint, PortfolioPointResponse } from "@/types/simulation";

interface SimulationResultsProps {
  hasResults: boolean;
  isSimulating: boolean;
  isSimulatingCustom: boolean;
  efData: EfficientFrontierResponse | null;
  maxSharpePoint: FrontierPoint | null;
  riskParityPoint: FrontierPoint | null;
  customPortfolioPoint: PortfolioPointResponse | null;
  comparisonPortfolioPoints: PortfolioPointResponse[];
  selectedAssets: string[];
  simulationId: string;
}

export function SimulationResults({
  hasResults,
  isSimulating,
  isSimulatingCustom,
  efData,
  maxSharpePoint,
  riskParityPoint,
  customPortfolioPoint,
  comparisonPortfolioPoints,
  selectedAssets,
  simulationId,
}: SimulationResultsProps) {
  if (!hasResults) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center border-dashed border-2 bg-white/50 text-center border-slate-200">
        <div className="max-w-xs space-y-4 px-6">
          <div className="h-20 w-20 bg-white shadow-sm rounded-3xl flex items-center justify-center mx-auto">
            <TrendingUp className="h-10 w-10 text-primary/40" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-slate-900">
              {isSimulating || isSimulatingCustom ? "Generating Frontier..." : "Ready to Analyze"}
            </p>
            <p className="text-slate-500">
              {isSimulating || isSimulatingCustom
                ? "Our optimizer is calculating the best possible allocations for your selected assets." 
                : "Select at least two assets from the left panel and click 'Run Simulation' to visualize the optimal risk-return curve."}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-0 pt-6 px-6">
          <CardTitle className="text-xl">Efficient Frontier Chart</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EfficientFrontierChart 
            frontier={efData!.frontier} 
            maxSharpe={maxSharpePoint} 
            riskParity={riskParityPoint}
            customPortfolioPoint={customPortfolioPoint}
            comparisonPortfolioPoints={comparisonPortfolioPoints}
            assetsKey={`${selectedAssets.sort().join(",")}-${simulationId}`}
          />
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-xl">Allocation Summary</CardTitle>
          <CardDescription>Key metrics for optimal and selected points</CardDescription>
        </CardHeader>
        <CardContent>
          <AllocationTable 
            riskParityPoint={riskParityPoint}
            maxSharpePoint={maxSharpePoint}
            comparisonPortfolioPoints={comparisonPortfolioPoints}
          />
        </CardContent>
      </Card>
    </div>
  );
}

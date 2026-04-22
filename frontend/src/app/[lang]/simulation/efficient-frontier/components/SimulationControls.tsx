"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssetSelector } from "@/components/simulation/AssetSelector";
import { CustomAllocationInput } from "@/components/simulation/CustomAllocationInput";
import { ComparisonPortfolioSelector } from "@/components/simulation/ComparisonPortfolioSelector";
import { Info } from "lucide-react";

interface SimulationControlsProps {
  selectedAssets: string[];
  isSimulating: boolean;
  isSimulatingCustom: boolean;
  isSavingSimulation: boolean;
  hasResults: boolean;
  isSaveSuccess: boolean;
  saveError: any;
  anyError: any;
  onRunSimulation: () => void;
  onCalculateCustom: () => void;
  onSaveResult: () => void;
}

export function SimulationControls({
  selectedAssets,
  isSimulating,
  isSimulatingCustom,
  isSavingSimulation,
  hasResults,
  isSaveSuccess,
  saveError,
  anyError,
  onRunSimulation,
  onCalculateCustom,
  onSaveResult,
}: SimulationControlsProps) {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Assets & Allocation</CardTitle>
          <CardDescription>Select at least 2 assets to begin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AssetSelector />
          <CustomAllocationInput 
            selectedAssetCodes={selectedAssets} 
            onCalculateCustom={onCalculateCustom}
            isCalculatingCustom={isSimulatingCustom}
          />
          
          <div className="pt-4 space-y-3">
            <Button 
              className="w-full h-11 text-base font-medium shadow-sm transition-all active:scale-[0.98]" 
              disabled={selectedAssets.length < 2 || isSimulating || isSimulatingCustom}
              onClick={onRunSimulation}
            >
              {isSimulating ? "Calculating..." : "Run Simulation"}
            </Button>

            {hasResults && (
              <Button
                variant="outline"
                className="w-full h-11 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                disabled={isSavingSimulation}
                onClick={onSaveResult}
              >
                {isSavingSimulation ? "Saving..." : "Save Result"}
              </Button>
            )}
          </div>

          {isSaveSuccess && (
            <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
              Simulation result saved successfully!
            </p>
          )}
          {(saveError || anyError) && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
              Error: {((saveError || anyError) as any).message || "Operation failed"}
            </p>
          )}
        </CardContent>
      </Card>

      {hasResults && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Compare Portfolios</CardTitle>
              <Info className="h-4 w-4 text-slate-400" />
            </div>
            <CardDescription>Add your saved portfolios to the chart</CardDescription>
          </CardHeader>
          <CardContent>
            <ComparisonPortfolioSelector />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

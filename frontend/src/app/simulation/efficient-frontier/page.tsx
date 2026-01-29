"use client";

import { useState } from "react";
import { AssetSelector } from "@/components/simulation/AssetSelector";
import { EfficientFrontierChart } from "@/components/simulation/EfficientFrontierChart";
import { AllocationTable } from "@/components/simulation/AllocationTable";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEfficientFrontier } from "@/hooks/useEfficientFrontier";
import { Button } from "@/components/ui/button";

export default function EfficientFrontierPage() {
  const selectedAssets = useSimulationStore((state) => state.selectedAssetCodes);
  const [isSimulating, setIsSimulating] = useState(false);

  const { data, isLoading, error } = useEfficientFrontier(
    { assets: selectedAssets, n_points: 50 },
    isSimulating
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Efficient Frontier Simulation</h1>
        <p className="text-slate-500">
          Analyze the risk and return trade-off for your selected portfolio of assets.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <AssetSelector />
          <Button 
            className="w-full h-12 text-lg font-medium shadow-sm transition-all active:scale-[0.98]" 
            disabled={selectedAssets.length < 2 || isLoading}
            onClick={() => setIsSimulating(true)}
          >
            {isLoading ? "Calculating..." : "Run Simulation"}
          </Button>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
              Error: {error.message}
            </p>
          )}
        </div>
        
        <div className="lg:col-span-2">
          {data ? (
            <div className="space-y-8">
              <EfficientFrontierChart 
                frontier={data.frontier} 
                maxSharpe={data.max_sharpe} 
              />
              <AllocationTable />
            </div>
          ) : (
            <div className="flex h-[550px] items-center justify-center bg-white rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-center p-8 shadow-inner">
              <div className="max-w-xs space-y-2">
                <p className="text-lg font-medium text-slate-500">No results yet</p>
                <p className="text-sm">Select at least 2 assets from the list and click "Run Simulation" to generate the optimization curve.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { AssetSelector } from "@/components/simulation/AssetSelector";
import { EfficientFrontierChart } from "@/components/simulation/EfficientFrontierChart";
import { AllocationTable } from "@/components/simulation/AllocationTable";
import { useSimulationLifecycle } from "@/hooks/useSimulationLifecycle";
import { Button } from "@/components/ui/button";

export default function EfficientFrontierPage() {
  const {
    isSimulating,
    runSimulation,
    lastRunId,
    efData,
    efError,
    rpError,
    hasResults,
    maxSharpePoint,
    riskParityPoint,
    selectedAssets
  } = useSimulationLifecycle();

  const anyError = efError || rpError;

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
            disabled={selectedAssets.length < 2 || isSimulating}
            onClick={runSimulation}
          >
            {isSimulating ? "Calculating..." : "Run Simulation"}
          </Button>
          {anyError && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
              Error: {(anyError as any).message || "Simulation failed"}
            </p>
          )}
        </div>
        
        <div className="lg:col-span-2">
          {hasResults ? (
            <div className="space-y-8">
              <EfficientFrontierChart 
                frontier={efData!.frontier} 
                maxSharpe={maxSharpePoint} 
                riskParity={riskParityPoint}
                assetsKey={`${selectedAssets.sort().join(",")}-${lastRunId}`}
              />
              <AllocationTable 
                riskParityPoint={riskParityPoint}
                maxSharpePoint={maxSharpePoint}
              />
            </div>
          ) : (
            <div className="flex h-[550px] items-center justify-center bg-white rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-center p-8 shadow-inner">
              <div className="max-w-xs space-y-2">
                <p className="text-lg font-medium text-slate-500">
                  {isSimulating ? "Calculating..." : "No results yet"}
                </p>
                <p className="text-sm">
                  {isSimulating 
                    ? "Our optimizer is finding the best allocations for you." 
                    : "Select assets and click 'Run Simulation' to see the updated results."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
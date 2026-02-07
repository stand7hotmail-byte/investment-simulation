"use client";

import { useState, useEffect, useRef } from "react";
import { AssetSelector } from "@/components/simulation/AssetSelector";
import { EfficientFrontierChart } from "@/components/simulation/EfficientFrontierChart";
import { AllocationTable } from "@/components/simulation/AllocationTable";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEfficientFrontier } from "@/hooks/useEfficientFrontier";
import { useRiskParity } from "@/hooks/useRiskParity";
import { Button } from "@/components/ui/button";

export default function EfficientFrontierPage() {
  const selectedAssets = useSimulationStore((state) => state.selectedAssetCodes);
  const clearResults = useSimulationStore((state) => state.clearResults);
  const setRiskParityPoint = useSimulationStore((state) => state.setRiskParityPoint);
  const setMaxSharpePoint = useSimulationStore((state) => state.setMaxSharpePoint);
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);
  
  const riskParityPoint = useSimulationStore((state) => state.riskParityPoint);
  const maxSharpePoint = useSimulationStore((state) => state.maxSharpePoint);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastRunId, setLastRunId] = useState(0);
  const hasAutoSelected = useRef(false);

  useEffect(() => {
    clearResults();
    hasAutoSelected.current = false;
    setIsSimulating(false);
  }, [selectedAssets, clearResults]);

  const { 
    data: efData, 
    isSuccess: isEfSuccess, 
    isLoading: isEfLoading,
    error: efError 
  } = useEfficientFrontier(
    { assets: selectedAssets, n_points: 50 },
    isSimulating
  );

  const { 
    data: rpData, 
    isSuccess: isRpSuccess, 
    isLoading: isRpLoading,
    error: rpError 
  } = useRiskParity(
    { assets: selectedAssets },
    isSimulating
  );

  const handleRunSimulation = () => {
    hasAutoSelected.current = false;
    setLastRunId(Date.now());
    setIsSimulating(true);
  };

  useEffect(() => {
    if (isEfSuccess && efData) {
      setMaxSharpePoint(efData.max_sharpe);
    }
  }, [isEfSuccess, efData, setMaxSharpePoint]);

  useEffect(() => {
    if (isRpSuccess && rpData) {
      setRiskParityPoint(rpData);
      if (!hasAutoSelected.current) {
        setSelectedPoint(rpData);
        hasAutoSelected.current = true;
        // Keep isSimulating true while the other query might be loading
      }
    }
  }, [isRpSuccess, rpData, setRiskParityPoint, setSelectedPoint]);

  // Turn off isSimulating only when both are done loading
  useEffect(() => {
    if (!isEfLoading && !isRpLoading) {
      setIsSimulating(false);
    }
  }, [isEfLoading, isRpLoading]);

  const hasResults = riskParityPoint !== null && efData !== undefined;
  const anyLoading = isEfLoading || isRpLoading || isSimulating;
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
            disabled={selectedAssets.length < 2 || anyLoading}
            onClick={handleRunSimulation}
          >
            {anyLoading ? "Calculating..." : "Run Simulation"}
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
                frontier={efData.frontier} 
                maxSharpe={maxSharpePoint} 
                riskParity={riskParityPoint}
                assetsKey={`${selectedAssets.sort().join(",")}-${lastRunId}`}
              />
              <AllocationTable />
            </div>
          ) : (
            <div className="flex h-[550px] items-center justify-center bg-white rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-center p-8 shadow-inner">
              <div className="max-w-xs space-y-2">
                <p className="text-lg font-medium text-slate-500">
                  {anyLoading ? "Calculating..." : "No results yet"}
                </p>
                <p className="text-sm">
                  {anyLoading 
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
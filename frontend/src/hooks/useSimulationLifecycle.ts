import { useState, useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEfficientFrontier } from "./useEfficientFrontier";
import { useRiskParity } from "./useRiskParity";

export function useSimulationLifecycle() {
  const selectedAssets = useSimulationStore((state) => state.selectedAssetCodes);
  const clearResults = useSimulationStore((state) => state.clearResults);
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);
  const selectedPoint = useSimulationStore((state) => state.selectedPoint);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastRunId, setLastRunId] = useState(0);
  const hasAutoSelected = useRef(false);

  // Clear results when assets change
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

  const runSimulation = useCallback(() => {
    hasAutoSelected.current = false;
    setLastRunId(Date.now());
    setIsSimulating(true);
  }, []);

  // Auto-select Risk Parity point when results arrive
  useEffect(() => {
    if (isRpSuccess && rpData && !hasAutoSelected.current) {
      setSelectedPoint(rpData);
      hasAutoSelected.current = true;
    }
  }, [isRpSuccess, rpData, setSelectedPoint]);

  // Handle loading state
  useEffect(() => {
    if (!isEfLoading && !isRpLoading && isSimulating) {
      setIsSimulating(false);
    }
  }, [isEfLoading, isRpLoading, isSimulating]);

  return {
    isSimulating: isSimulating || isEfLoading || isRpLoading,
    runSimulation,
    lastRunId,
    efData,
    rpData,
    efError,
    rpError,
    hasResults: rpData !== undefined && efData !== undefined,
    maxSharpePoint: efData?.max_sharpe || null,
    riskParityPoint: rpData || null,
    selectedPoint,
    selectedAssets
  };
}

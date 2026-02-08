import { useState, useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEfficientFrontier } from "./useEfficientFrontier";
import { useRiskParity } from "./useRiskParity";

export function useSimulationLifecycle() {
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

  // Sync results to store
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
      }
    }
  }, [isRpSuccess, rpData, setRiskParityPoint, setSelectedPoint]);

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
    hasResults: riskParityPoint !== null && efData !== undefined,
    maxSharpePoint,
    riskParityPoint,
    selectedAssets
  };
}

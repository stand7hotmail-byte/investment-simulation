import { useEffect, useRef, useCallback, useMemo } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEfficientFrontier } from "./useEfficientFrontier";
import { useRiskParity } from "./useRiskParity";

export function useSimulationLifecycle() {
  // Store state
  const selectedAssets = useSimulationStore((state) => state.selectedAssetCodes);
  const simulatedAssets = useSimulationStore((state) => state.simulatedAssetCodes);
  const simulationId = useSimulationStore((state) => state.simulationId);
  const isSimulating = useSimulationStore((state) => state.isSimulating);
  const selectedPoint = useSimulationStore((state) => state.selectedPoint);
  
  // Store actions
  const runSimulationStore = useSimulationStore((state) => state.runSimulation);
  const setIsSimulating = useSimulationStore((state) => state.setIsSimulating);
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);
  
  const hasAutoSelected = useRef(false);

  // Queries
  const efRequest = useMemo(() => ({ assets: simulatedAssets, n_points: 50 }), [simulatedAssets]);
  const { 
    data: efData, 
    isSuccess: isEfSuccess, 
    isLoading: isEfLoading,
    error: efError 
  } = useEfficientFrontier(efRequest, simulatedAssets.length >= 2);

  const rpRequest = useMemo(() => ({ assets: simulatedAssets }), [simulatedAssets]);
  const { 
    data: rpData, 
    isSuccess: isRpSuccess, 
    isLoading: isRpLoading,
    error: rpError 
  } = useRiskParity(rpRequest, simulatedAssets.length >= 2);

  const runSimulation = useCallback(() => {
    hasAutoSelected.current = false;
    runSimulationStore();
  }, [runSimulationStore]);

  // Auto-select Risk Parity point when NEW results arrive
  useEffect(() => {
    if (isRpSuccess && rpData && !hasAutoSelected.current) {
      setSelectedPoint(rpData);
      hasAutoSelected.current = true;
    }
  }, [isRpSuccess, rpData, setSelectedPoint]);

  // Sync global isSimulating state with query status
  useEffect(() => {
    const activeLoading = isEfLoading || isRpLoading;
    if (isSimulating && !activeLoading && (isEfSuccess || efError) && (isRpSuccess || rpError)) {
      setIsSimulating(false);
    }
  }, [isEfLoading, isRpLoading, isSimulating, isEfSuccess, isRpSuccess, efError, rpError, setIsSimulating]);

  return {
    isSimulating: isSimulating || isEfLoading || isRpLoading,
    runSimulation,
    simulationId,
    efData,
    rpData,
    efError,
    rpError,
    hasResults: !!(rpData && efData),
    maxSharpePoint: efData?.max_sharpe || null,
    riskParityPoint: rpData || null,
    selectedPoint,
    selectedAssets
  };
}

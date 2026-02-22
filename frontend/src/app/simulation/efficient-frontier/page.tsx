"use client";

import { AssetSelector } from "@/components/simulation/AssetSelector";
import { CustomAllocationInput } from "@/components/simulation/CustomAllocationInput";
import { EfficientFrontierChart } from "@/components/simulation/EfficientFrontierChart";
import { ComparisonPortfolioSelector } from "@/components/simulation/ComparisonPortfolioSelector"; // New import
import { AllocationTable } from "@/components/simulation/AllocationTable";
import { useSimulationLifecycle } from "@/hooks/useSimulationLifecycle";
import { useCustomPortfolioSimulation } from "@/hooks/useCustomPortfolioSimulation"; // New import
import { useSimulationStore } from "@/store/useSimulationStore"; // New import
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react"; // Added useEffect
import { PortfolioPointResponse, PortfolioPointsRequest } from "@/types/simulation"; // Added PortfolioPointsRequest
import { useComparisonPortfolios } from "@/hooks/useComparisonPortfolios";
import { usePortfolioPointsSimulation } from "@/hooks/usePortfolioPointsSimulation"; // New import
import { useSaveSimulationResult } from "@/hooks/useSaveSimulationResult"; // New import

export default function EfficientFrontierPage() {
  const {
    isSimulating,
    runSimulation,
    simulationId,
    efData,
    efError,
    rpError,
    hasResults,
    maxSharpePoint,
    riskParityPoint,
    selectedAssets
  } = useSimulationLifecycle();

  const { customAllocations, selectedComparisonPortfolioIds, setUseCustomAllocations, setSelectedPoint } = useSimulationStore();
  const { mutate: simulateCustom, isPending: isSimulatingCustom, error: customSimError } = useCustomPortfolioSimulation();
  const { comparisonPortfolios, isLoading: isLoadingComparisonPortfolios, error: comparisonPortfoliosError } = useComparisonPortfolios(); // New hook
  const { mutate: simulatePortfolioPoints, isPending: isSimulatingComparisonPoints, data: simulatedComparisonPoints, error: comparisonPointsError } = usePortfolioPointsSimulation();

  const [customPortfolioPoint, setCustomPortfolioPoint] = useState<PortfolioPointResponse | null>(null);
  const [comparisonPortfolioPoints, setComparisonPortfolioPoints] = useState<PortfolioPointResponse[]>([]);

  const anyError = efError || rpError || customSimError || comparisonPortfoliosError || comparisonPointsError; // Update anyError

  const { mutate: saveSimulationResult, isPending: isSavingSimulation, isSuccess: isSaveSuccess, error: saveError } = useSaveSimulationResult();

  // Trigger simulation for comparison portfolios when selected IDs change
  useEffect(() => {
    if (selectedComparisonPortfolioIds.length > 0) {
      simulatePortfolioPoints(
        { portfolio_ids: selectedComparisonPortfolioIds },
        {
          onSuccess: (data) => {
            setComparisonPortfolioPoints(data);
          },
          onError: (error) => {
            console.error("Comparison portfolio simulation failed:", error);
            setComparisonPortfolioPoints([]);
          },
        }
      );
    } else {
      setComparisonPortfolioPoints([]);
    }
  }, [selectedComparisonPortfolioIds, simulatePortfolioPoints]);

  const handleCalculateCustomPortfolio = () => {
    const totalWeight = Object.values(customAllocations).reduce((sum, weight) => sum + weight, 0);

    if (selectedAssets.length === 0) {
      alert("Please select assets first.");
      return;
    }
    if (totalWeight < 99.9 || totalWeight > 100.1) { // Allow for small floating point inaccuracies
      alert("Total custom allocation must be approximately 100%.");
      return;
    }

    const weightsInDecimal = Object.entries(customAllocations).reduce((acc, [code, weight]) => {
        acc[code] = weight / 100; // Convert percentage to decimal
        return acc;
    }, {} as Record<string, number>);

    simulateCustom(
      { assets: selectedAssets, weights: weightsInDecimal },
      {
        onSuccess: (data) => {
          setCustomPortfolioPoint(data);
          setSelectedPoint({
            expected_return: data.expected_return,
            volatility: data.volatility,
            weights: data.weights,
          });
          setUseCustomAllocations(true); // Indicate that custom allocations are being used
        },
        onError: (error) => {
          console.error("Custom simulation failed:", error);
          setCustomPortfolioPoint(null);
        },
      }
    );
  };

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
          <CustomAllocationInput 
            selectedAssetCodes={selectedAssets} 
            onCalculateCustom={handleCalculateCustomPortfolio}
            isCalculatingCustom={isSimulatingCustom}
          />
          <Button 
            className="w-full h-12 text-lg font-medium shadow-sm transition-all active:scale-[0.98]" 
            disabled={selectedAssets.length < 2 || isSimulating || isSimulatingCustom}
            onClick={runSimulation}
          >
            {isSimulating ? "Calculating..." : "Run Simulation"}
          </Button>

          {hasResults && (
            <Button
              className="w-full h-12 text-lg font-medium shadow-sm transition-all active:scale-[0.98]"
              disabled={isSavingSimulation}
              onClick={() => {
                if (!efData) return; // Ensure efficient frontier data exists

                const simulationType = "efficient_frontier"; // Or determine dynamically
                const parameters = {
                  assets: selectedAssets,
                  n_points: efData.frontier.length,
                };
                const results = {
                  frontier: efData.frontier,
                  max_sharpe: maxSharpePoint,
                  risk_parity: riskParityPoint,
                  custom_portfolio: customPortfolioPoint,
                  comparison_portfolios: comparisonPortfolioPoints,
                };

                saveSimulationResult({
                  simulation_type: simulationType,
                  parameters: parameters,
                  results: results,
                  // portfolio_id is optional, can be derived if a specific portfolio is being simulated
                });
              }}
            >
              {isSavingSimulation ? "Saving..." : "Save Simulation Result"}
            </Button>
          )}

          {isSaveSuccess && (
            <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
              Simulation result saved successfully!
            </p>
          )}
          {saveError && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
              Error saving simulation result: {(saveError as any).message}
            </p>
          )}
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
                customPortfolioPoint={customPortfolioPoint} // Pass custom portfolio point
                comparisonPortfolioPoints={comparisonPortfolioPoints} // Pass calculated comparison points
                assetsKey={`${selectedAssets.sort().join(",")}-${simulationId}`}
              />
              <AllocationTable 
                riskParityPoint={riskParityPoint}
                maxSharpePoint={maxSharpePoint}
                comparisonPortfolioPoints={comparisonPortfolioPoints} // Pass comparison portfolio points
              />
              <ComparisonPortfolioSelector /> {/* New component */}
            </div>
          ) : (
            <div className="flex h-[550px] items-center justify-center bg-white rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-center p-8 shadow-inner">
              <div className="max-w-xs space-y-2">
                <p className="text-lg font-medium text-slate-500">
                  {isSimulating || isSimulatingCustom ? "Calculating..." : "No results yet"}
                </p>
                <p className="text-sm">
                  {isSimulating || isSimulatingCustom
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
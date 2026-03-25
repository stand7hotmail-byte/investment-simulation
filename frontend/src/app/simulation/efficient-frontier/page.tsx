"use client";

import { useSimulationLifecycle } from "@/hooks/useSimulationLifecycle";
import { useCustomPortfolioSimulation } from "@/hooks/useCustomPortfolioSimulation";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useState, useEffect } from "react";
import { PortfolioPointResponse } from "@/types/simulation";
import { useComparisonPortfolios } from "@/hooks/useComparisonPortfolios";
import { usePortfolioPointsSimulation } from "@/hooks/usePortfolioPointsSimulation";
import { useSaveSimulationResult } from "@/hooks/useSaveSimulationResult";
import { SimulationControls } from "./components/SimulationControls";
import { SimulationResults } from "./components/SimulationResults";
import { AffiliateSection } from "@/components/simulation/AffiliateSection";

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
  const { error: comparisonPortfoliosError } = useComparisonPortfolios();
  const { mutate: simulatePortfolioPoints, isPending: isSimulatingComparisonPoints, error: comparisonPointsError } = usePortfolioPointsSimulation();

  const [customPortfolioPoint, setCustomPortfolioPoint] = useState<PortfolioPointResponse | null>(null);
  const [comparisonPortfolioPoints, setComparisonPortfolioPoints] = useState<PortfolioPointResponse[]>([]);

  const anyError = efError || rpError || customSimError || comparisonPortfoliosError || comparisonPointsError;

  const { mutate: saveSimulationResult, isPending: isSavingSimulation, isSuccess: isSaveSuccess, error: saveError } = useSaveSimulationResult();

  useEffect(() => {
    if (selectedComparisonPortfolioIds.length > 0) {
      simulatePortfolioPoints(
        { portfolio_ids: selectedComparisonPortfolioIds },
        {
          onSuccess: (data) => setComparisonPortfolioPoints(data),
          onError: () => setComparisonPortfolioPoints([]),
        }
      );
    } else {
      setComparisonPortfolioPoints([]);
    }
  }, [selectedComparisonPortfolioIds, simulatePortfolioPoints]);

  const handleCalculateCustomPortfolio = () => {
    const totalWeight = Object.values(customAllocations).reduce((sum, weight) => sum + weight, 0);

    if (selectedAssets.length === 0) return alert("Please select assets first.");
    if (totalWeight < 99.9 || totalWeight > 100.1) return alert("Total custom allocation must be ~100%.");

    const weightsInDecimal = Object.entries(customAllocations).reduce((acc, [code, weight]) => {
        acc[code] = weight / 100;
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
          setUseCustomAllocations(true);
        },
        onError: () => setCustomPortfolioPoint(null),
      }
    );
  };

  const handleSaveResult = () => {
    if (!efData) return;
    saveSimulationResult({
      simulation_type: "efficient_frontier",
      parameters: { assets: selectedAssets, n_points: efData.frontier.length },
      results: {
        frontier: efData.frontier,
        max_sharpe: maxSharpePoint,
        risk_parity: riskParityPoint,
        custom_portfolio: customPortfolioPoint,
        comparison_portfolios: comparisonPortfolioPoints,
      },
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Efficient Frontier</h1>
        <p className="text-slate-500 text-lg">Analyze the risk and return trade-off for your selected portfolio of assets.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <SimulationControls 
            selectedAssets={selectedAssets}
            isSimulating={isSimulating}
            isSimulatingCustom={isSimulatingCustom}
            isSavingSimulation={isSavingSimulation}
            hasResults={hasResults}
            isSaveSuccess={isSaveSuccess}
            saveError={saveError}
            anyError={anyError}
            onRunSimulation={runSimulation}
            onCalculateCustom={handleCalculateCustomPortfolio}
            onSaveResult={handleSaveResult}
          />
        </div>
        
        <div className="lg:col-span-8">
          <SimulationResults 
            hasResults={hasResults}
            isSimulating={isSimulating}
            isSimulatingCustom={isSimulatingCustom}
            efData={efData || null}
            maxSharpePoint={maxSharpePoint}
            riskParityPoint={riskParityPoint}
            customPortfolioPoint={customPortfolioPoint}
            comparisonPortfolioPoints={comparisonPortfolioPoints}
            selectedAssets={selectedAssets}
            simulationId={simulationId?.toString() || ""}
          />
        </div>
      </div>

      {/* Affiliate Recommendations */}
      <div className="max-w-6xl mx-auto py-12 px-4 border-t border-slate-200 mt-12">
        <AffiliateSection />
      </div>
    </div>
  );
}

"use client";

import { AssetSelector } from "@/components/simulation/AssetSelector";
import { CustomAllocationInput } from "@/components/simulation/CustomAllocationInput";
import { EfficientFrontierChart } from "@/components/simulation/EfficientFrontierChart";
import { ComparisonPortfolioSelector } from "@/components/simulation/ComparisonPortfolioSelector";
import { AllocationTable } from "@/components/simulation/AllocationTable";
import { useSimulationLifecycle } from "@/hooks/useSimulationLifecycle";
import { useCustomPortfolioSimulation } from "@/hooks/useCustomPortfolioSimulation";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { PortfolioPointResponse } from "@/types/simulation";
import { useComparisonPortfolios } from "@/hooks/useComparisonPortfolios";
import { usePortfolioPointsSimulation } from "@/hooks/usePortfolioPointsSimulation";
import { useSaveSimulationResult } from "@/hooks/useSaveSimulationResult";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp, Info } from "lucide-react";

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
  const { isLoading: isLoadingComparisonPortfolios, error: comparisonPortfoliosError } = useComparisonPortfolios();
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
    if (totalWeight < 99.9 || totalWeight > 100.1) {
      alert("Total custom allocation must be approximately 100%.");
      return;
    }

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
        onError: (error) => {
          console.error("Custom simulation failed:", error);
          setCustomPortfolioPoint(null);
        },
      }
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Efficient Frontier</h1>
        <p className="text-slate-500 text-lg">
          Analyze the risk and return trade-off for your selected portfolio of assets.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Assets & Allocation</CardTitle>
              <CardDescription>Select at least 2 assets to begin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AssetSelector />
              <CustomAllocationInput 
                selectedAssetCodes={selectedAssets} 
                onCalculateCustom={handleCalculateCustomPortfolio}
                isCalculatingCustom={isSimulatingCustom}
              />
              
              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full h-11 text-base font-medium shadow-sm transition-all active:scale-[0.98]" 
                  disabled={selectedAssets.length < 2 || isSimulating || isSimulatingCustom}
                  onClick={runSimulation}
                >
                  {isSimulating ? "Calculating..." : "Run Simulation"}
                </Button>

                {hasResults && (
                  <Button
                    variant="outline"
                    className="w-full h-11 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                    disabled={isSavingSimulation}
                    onClick={() => {
                      if (!efData) return;

                      const results = {
                        frontier: efData.frontier,
                        max_sharpe: maxSharpePoint,
                        risk_parity: riskParityPoint,
                        custom_portfolio: customPortfolioPoint,
                        comparison_portfolios: comparisonPortfolioPoints,
                      };

                      saveSimulationResult({
                        simulation_type: "efficient_frontier",
                        parameters: { assets: selectedAssets, n_points: efData.frontier.length },
                        results: results,
                      });
                    }}
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
        
        {/* Right Column - Results */}
        <div className="lg:col-span-8">
          {hasResults ? (
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
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

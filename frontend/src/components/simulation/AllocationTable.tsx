"use client";

import { useSimulationStore } from "@/store/useSimulationStore";
import { useAssets } from "@/hooks/useAssets";
import { isPointMatch, getStrategyNameKey } from "@/lib/simulation-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, MousePointer2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

import { FrontierPoint, PortfolioPointResponse } from "@/types/simulation";

interface Props {
  riskParityPoint?: FrontierPoint | null;
  maxSharpePoint?: FrontierPoint | null;
  comparisonPortfolioPoints?: PortfolioPointResponse[]; // New prop
}

export function AllocationTable({ riskParityPoint, maxSharpePoint, comparisonPortfolioPoints }: Props) {
  const selectedPoint = useSimulationStore((state) => state.selectedPoint);
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);
  const { data: assets } = useAssets();
  const { t } = useI18n();

  if (!selectedPoint) {
    return null;
  }

  const strategyNameKey = getStrategyNameKey(selectedPoint, riskParityPoint ?? null, maxSharpePoint ?? null);
  const strategyName = t(strategyNameKey);

  const getAssetName = (code: string) => {
    const asset = assets?.find((a) => a.asset_code === code);
    return asset ? asset.name : code;
  };

  const weights = Object.entries(selectedPoint.weights)
    .filter(([_, weight]) => weight > 0.0001)
    .sort(([_, a], [__, b]) => b - a);

  // Assuming a risk-free rate of 2% for Sharpe Ratio calculation
  const RISK_FREE_RATE = 0.02;

  const calculateSharpeRatio = (point: { expected_return: number; volatility: number }) => {
    if (point.volatility === 0) return 0; // Avoid division by zero
    return (point.expected_return - RISK_FREE_RATE) / point.volatility;
  };

  const currentPortfolioSharpe = calculateSharpeRatio(selectedPoint);

  // Process comparison portfolios to include Sharpe Ratio
  const comparedPortfoliosWithSharpe = (comparisonPortfolioPoints || []).map(p => ({
    ...p,
    sharpe_ratio: calculateSharpeRatio(p)
  }));

  return (
    <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Quick Strategy Selector */}
      <div className="flex flex-wrap gap-2">
        {riskParityPoint && (
          <Button 
            variant={isPointMatch(riskParityPoint, selectedPoint) ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPoint(riskParityPoint)}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            {t('dashboard.simulationTypeRiskParity')}
          </Button>
        )}
        {maxSharpePoint && (
          <Button 
            variant={isPointMatch(maxSharpePoint, selectedPoint) ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPoint(maxSharpePoint)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {t('common.sharpeRatio')}
          </Button>
        )}
        <div className="flex-1" />
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 italic">
          <MousePointer2 className="w-3 h-3" />
          {t('simulation.clickChartInstruction')}
        </div>
      </div>

      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">
            {strategyName}
          </div>
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>{t('simulation.allocationDetails')}</span>
            <div className="flex space-x-4 text-sm font-normal text-slate-500">
              <span>{t('common.risk')}: {(selectedPoint.volatility * 100).toFixed(2)}%</span>
              <span>{t('common.return')}: {(selectedPoint.expected_return * 100).toFixed(2)}%</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('simulation.assetName')}</TableHead>
                <TableHead className="text-right">{t('simulation.allocationPercent')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weights.map(([code, weight]) => (
                <TableRow key={code} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium">{getAssetName(code)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {(weight * 100).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
              </CardContent>
            </Card>
        
            {comparedPortfoliosWithSharpe.length > 0 && (
              <Card className="w-full shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">{t('simulation.comparisonSummary')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('nav.portfolios')}</TableHead>
                        <TableHead className="text-right">{t('common.risk')}</TableHead>
                        <TableHead className="text-right">{t('common.return')}</TableHead>
                        <TableHead className="text-right">{t('common.sharpeRatio')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Current Selected Portfolio */}
                      <TableRow className="bg-blue-50/50">
                        <TableCell className="font-medium">{t('simulation.currentSelection')} ({strategyName})</TableCell>
                        <TableCell className="text-right tabular-nums">{(selectedPoint.volatility * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right tabular-nums">{(selectedPoint.expected_return * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right tabular-nums">{currentPortfolioSharpe.toFixed(2)}</TableCell>
                      </TableRow>
        
                      {/* Compared Portfolios */}
                      {comparedPortfoliosWithSharpe.map((point, index) => (
                        <TableRow key={`comp-${index}`}>
                          <TableCell className="font-medium">{t('simulation.comparedPortfolio')} {index + 1}</TableCell>
                          <TableCell className="text-right tabular-nums">{(point.volatility * 100).toFixed(2)}%</TableCell>
                          <TableCell className="text-right tabular-nums">{(point.expected_return * 100).toFixed(2)}%</TableCell>
                          <TableCell className="text-right tabular-nums">{point.sharpe_ratio.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}    </div>
  );
}

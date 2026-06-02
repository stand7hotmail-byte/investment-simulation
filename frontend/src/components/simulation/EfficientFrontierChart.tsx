import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { FrontierPoint, PortfolioPointResponse } from "@/types/simulation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useAssets } from "@/hooks/useAssets";
import { createChartLayout, CHART_CONFIG, useChartTheme, getChartThemeColors } from "@/lib/chart-utils";
import { useI18n } from "@/hooks/useI18n";

const Plot = dynamic(() => import("react-plotly.js"), { 
  ssr: false,
  loading: () => <div className="flex h-[450px] items-center justify-center bg-card/50 backdrop-blur-md rounded-2xl text-muted-foreground">Initializing...</div>
});

interface Props {
  frontier: FrontierPoint[];
  maxSharpe?: FrontierPoint | null;
  riskParity?: FrontierPoint | null;
  customPortfolioPoint?: PortfolioPointResponse | null;
  comparisonPortfolioPoints?: PortfolioPointResponse[];
  assetsKey: string;
}

export function EfficientFrontierChart({ frontier, maxSharpe, riskParity, customPortfolioPoint, comparisonPortfolioPoints, assetsKey }: Props) {
  const { t } = useI18n();
  const isDark = useChartTheme();
  const themeColors = getChartThemeColors(isDark);
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);
  const selectedPoint = useSimulationStore((state) => state.selectedPoint);
  const selectedAssetCodes = useSimulationStore((state) => state.selectedAssetCodes);
  const { data: allAssets } = useAssets();
  const [revision, setRevision] = useState(0);
  const plotRef = useRef<any>(null);

  useEffect(() => {
    setRevision(prev => prev + 1);
  }, [selectedPoint, isDark]);

  const dataRef = useRef({ frontier, maxSharpe, riskParity, customPortfolioPoint, comparisonPortfolioPoints, setSelectedPoint });
  useEffect(() => {
    dataRef.current = { frontier, maxSharpe, riskParity, customPortfolioPoint, comparisonPortfolioPoints, setSelectedPoint };
  }, [frontier, maxSharpe, riskParity, customPortfolioPoint, comparisonPortfolioPoints, setSelectedPoint]);

  const individualAssetTraces = useMemo(() => {
    if (!allAssets || !selectedAssetCodes || selectedAssetCodes.length === 0) return [];

    const selectedIndividualAssets = allAssets.filter(asset => 
      selectedAssetCodes.includes(asset.asset_code) &&
      asset.expected_return != null && asset.volatility != null
    );

    if (selectedIndividualAssets.length === 0) return [];

    return [{
      x: selectedIndividualAssets.map(asset => asset.volatility),
      y: selectedIndividualAssets.map(asset => asset.expected_return),
      mode: "markers+text",
      type: "scatter" as const,
      name: t('simulation.individualAssets'),
      marker: { size: 8, color: themeColors.text },
      text: selectedIndividualAssets.map(asset => asset.asset_code),
      textposition: "top center" as const,
      hovertemplate: `<b>%{text}</b><br>${t('common.risk')}: %{x:.2%}<br>${t('common.return')}: %{y:.2%}<extra></extra>`,
    }];
  }, [allAssets, selectedAssetCodes, t, themeColors]);

  const data = useMemo(() => [
    {
      x: frontier.map((p) => p.volatility),
      y: frontier.map((p) => p.expected_return),
      mode: "lines+markers",
      type: "scatter" as const,
      name: t('simulation.efTitle'),
      marker: { size: 6, color: themeColors.primary },
      line: { width: 2, color: themeColors.primary },
      hovertemplate: `${t('common.risk')}: %{x:.2%}<br>${t('common.return')}: %{y:.2%}<extra></extra>`,
    },
    ...individualAssetTraces,
    ...(maxSharpe ? [{
      x: [maxSharpe.volatility],
      y: [maxSharpe.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: t('simulation.maxSharpeStrategy'),
      marker: { size: 14, color: themeColors.danger, symbol: "star" },
      hovertemplate: `<b>${t('simulation.maxSharpeStrategy')}</b><br>${t('common.risk')}: %{x:.2%}<br>${t('common.return')}: %{y:.2%}<extra></extra>`,
    }] : []),
    ...(riskParity ? [{
      x: [riskParity.volatility],
      y: [riskParity.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: t('dashboard.simulationTypeRiskParity'),
      marker: { size: 14, color: themeColors.success, symbol: "diamond" },
      hovertemplate: `<b>${t('dashboard.simulationTypeRiskParity')}</b><br>${t('common.risk')}: %{x:.2%}<br>${t('common.return')}: %{y:.2%}<extra></extra>`,
    }] : []),
    ...(customPortfolioPoint ? [{
      x: [customPortfolioPoint.volatility],
      y: [customPortfolioPoint.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: t('simulation.customSelection'),
      marker: { size: 14, color: themeColors.secondary, symbol: "circle-open" },
      hovertemplate: `<b>${t('simulation.customSelection')}</b><br>${t('common.risk')}: %{x:.2%}<br>${t('common.return')}: %{y:.2%}<extra></extra>`,
    }] : []),
    ...(comparisonPortfolioPoints && comparisonPortfolioPoints.length > 0 ? comparisonPortfolioPoints.map((point, index) => ({
      x: [point.volatility],
      y: [point.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: `${t('simulation.comparedPortfolio')} ${index + 1}`,
      marker: { size: 14, color: `hsl(${index * 60}, 70%, 50%)`, symbol: "square" },
      hovertemplate: `<b>${t('simulation.comparedPortfolio')} ${index + 1}</b><br>${t('common.risk')}: %{x:.2%}<br>${t('common.return')}: %{y:.2%}<extra></extra>`,
    })) : []),
    ...(selectedPoint ? [{
      x: [selectedPoint.volatility],
      y: [selectedPoint.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: t('simulation.selection'),
      marker: { size: 18, color: "rgba(0,0,0,0)", line: { color: themeColors.warning, width: 3 }, symbol: "circle" },
      hoverinfo: "none" as const,
      showlegend: false
    }] : []),
  ], [frontier, individualAssetTraces, maxSharpe, riskParity, customPortfolioPoint, comparisonPortfolioPoints, selectedPoint, t, themeColors]);

  const layout = useMemo(() => {
    const l = createChartLayout({
      xAxisTitle: t('common.volatility'),
      yAxisTitle: t('common.expectedReturn'),
      height: 450,
      hovermode: "closest",
      isDark
    });
    return {
      ...l,
      xaxis: { ...l.xaxis, tickformat: ".1%" },
      yaxis: { ...l.yaxis, tickformat: ".1%" },
      dragmode: false,
      showlegend: true,
      legend: { orientation: "h", y: -0.2, font: { color: themeColors.text } },
      datarevision: revision
    };
  }, [revision, t, isDark, themeColors]);

  const handleNativeClick = useCallback((eventData: any) => {
    if (!eventData || !eventData.points || eventData.points.length === 0) return;
    
    const clickedPoint = eventData.points[0];
    const clickedX = clickedPoint.x;
    const curveNumber = clickedPoint.curveNumber;

    const { frontier, maxSharpe, riskParity, customPortfolioPoint, comparisonPortfolioPoints, setSelectedPoint } = dataRef.current;
    const individualAssetTraceIndex = data.findIndex(trace => trace.name === t('simulation.individualAssets'));

    if (curveNumber === individualAssetTraceIndex) {
      const assetCode = clickedPoint.text;
      const clickedAsset = allAssets?.find(a => a.asset_code === assetCode);
      
      if (clickedAsset && clickedAsset.expected_return != null && clickedAsset.volatility != null) {
        setSelectedPoint({
          expected_return: clickedAsset.expected_return,
          volatility: clickedAsset.volatility,
          weights: { [assetCode]: 1.0 }
        });
        setRevision(prev => prev + 1);
        return;
      }
    }

    const candidates = [
      ...(maxSharpe ? [maxSharpe] : []),
      ...(riskParity ? [riskParity] : []),
      ...(customPortfolioPoint ? [{
        expected_return: customPortfolioPoint.expected_return,
        volatility: customPortfolioPoint.volatility,
        weights: customPortfolioPoint.weights
      }] : []),
      ...(comparisonPortfolioPoints || []).map(p => ({
        expected_return: p.expected_return,
        volatility: p.volatility,
        weights: p.weights
      })),
      ...frontier
    ];

    if (candidates.length === 0) return;

    const nearest = candidates.reduce((prev, curr) => {
      return (Math.abs(curr.volatility - clickedX) < Math.abs(prev.volatility - clickedX)) ? curr : prev;
    });

    setSelectedPoint(nearest);
    setRevision(prev => prev + 1);
  }, [data, allAssets, t]);

  return (
    <Card className="w-full glass-card border-border/40 shadow-xl shadow-primary/5 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{t('simulation.efAnalysisTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md">
          <Plot
            key={assetsKey} 
            data={data as any}
            layout={layout as any}
            revision={revision}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
            onInitialized={(figure, graphDiv) => {
              plotRef.current = graphDiv;
              (graphDiv as any).on('plotly_click', handleNativeClick);
            }}
            onUpdate={(figure, graphDiv) => {
              (graphDiv as any).removeAllListeners?.('plotly_click');
              (graphDiv as any).on('plotly_click', handleNativeClick);
            }}
            config={CHART_CONFIG}
          />
        </div>
      </CardContent>
    </Card>
  );
}

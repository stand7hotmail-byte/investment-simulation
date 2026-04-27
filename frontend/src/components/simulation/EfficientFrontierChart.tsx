import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { FrontierPoint, PortfolioPointResponse } from "@/types/simulation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useAssets } from "@/hooks/useAssets";
import { CHART_COLORS, createChartLayout, CHART_CONFIG } from "@/lib/chart-utils";

const Plot = dynamic(() => import("react-plotly.js"), { 
  ssr: false,
  loading: () => <div className="flex h-[450px] items-center justify-center bg-slate-50 rounded-md text-slate-400">Initializing Chart...</div>
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
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);
  const selectedPoint = useSimulationStore((state) => state.selectedPoint);
  const selectedAssetCodes = useSimulationStore((state) => state.selectedAssetCodes);
  const { data: allAssets } = useAssets();
  const [revision, setRevision] = useState(0);
  const plotRef = useRef<any>(null);

  useEffect(() => {
    setRevision(prev => prev + 1);
  }, [selectedPoint]);

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
      name: "Individual Assets",
      marker: { size: 8, color: CHART_COLORS.text },
      text: selectedIndividualAssets.map(asset => asset.asset_code),
      textposition: "top center" as const,
      hovertemplate: "<b>%{text}</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
    }];
  }, [allAssets, selectedAssetCodes]);

  const data = useMemo(() => [
    {
      x: frontier.map((p) => p.volatility),
      y: frontier.map((p) => p.expected_return),
      mode: "lines+markers",
      type: "scatter" as const,
      name: "Efficient Frontier",
      marker: { size: 6, color: CHART_COLORS.primary },
      line: { width: 2, color: CHART_COLORS.primary },
      hovertemplate: "Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
    },
    ...individualAssetTraces,
    ...(maxSharpe ? [{
      x: [maxSharpe.volatility],
      y: [maxSharpe.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: "Max Sharpe Ratio",
      marker: { size: 14, color: CHART_COLORS.danger, symbol: "star" },
      hovertemplate: "<b>Max Sharpe</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
    }] : []),
    ...(riskParity ? [{
      x: [riskParity.volatility],
      y: [riskParity.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: "Risk Parity (ERC)",
      marker: { size: 14, color: CHART_COLORS.success, symbol: "diamond" },
      hovertemplate: "<b>Risk Parity</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
    }] : []),
    ...(customPortfolioPoint ? [{
      x: [customPortfolioPoint.volatility],
      y: [customPortfolioPoint.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: "Custom Portfolio",
      marker: { size: 14, color: CHART_COLORS.secondary, symbol: "circle-open" },
      hovertemplate: "<b>Custom Portfolio</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
    }] : []),
    ...(comparisonPortfolioPoints && comparisonPortfolioPoints.length > 0 ? comparisonPortfolioPoints.map((point, index) => ({
      x: [point.volatility],
      y: [point.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: `Compared Portfolio ${index + 1}`,
      marker: { size: 14, color: `hsl(${index * 60}, 70%, 50%)`, symbol: "square" },
      hovertemplate: `<b>Compared Portfolio ${index + 1}</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>`,
    })) : []),
    ...(selectedPoint ? [{
      x: [selectedPoint.volatility],
      y: [selectedPoint.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: "Selection",
      marker: { size: 18, color: "rgba(0,0,0,0)", line: { color: CHART_COLORS.warning, width: 3 }, symbol: "circle" },
      hoverinfo: "none" as const,
      showlegend: false
    }] : []),
  ], [frontier, individualAssetTraces, maxSharpe, riskParity, customPortfolioPoint, comparisonPortfolioPoints, selectedPoint]);

  const layout = useMemo(() => {
    const l = createChartLayout({
      xAxisTitle: "Risk (Volatility)",
      yAxisTitle: "Expected Return",
      height: 450,
      hovermode: "closest"
    });
    return {
      ...l,
      xaxis: { ...l.xaxis, tickformat: ".1%" },
      yaxis: { ...l.yaxis, tickformat: ".1%" },
      dragmode: false,
      showlegend: true,
      legend: { orientation: "h", y: -0.2 },
      datarevision: revision
    };
  }, [revision]);

  const handleNativeClick = useCallback((eventData: any) => {
    if (!eventData || !eventData.points || eventData.points.length === 0) return;
    
    const clickedPoint = eventData.points[0];
    const clickedX = clickedPoint.x;
    const curveNumber = clickedPoint.curveNumber;

    const { frontier, maxSharpe, riskParity, customPortfolioPoint, comparisonPortfolioPoints, setSelectedPoint } = dataRef.current;
    const individualAssetTraceIndex = data.findIndex(trace => trace.name === "Individual Assets");

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
  }, [data, allAssets]);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Efficient Frontier Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden rounded-md border border-slate-200 bg-white">
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

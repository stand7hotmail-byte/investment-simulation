"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { FrontierPoint } from "@/types/simulation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";

const Plot = dynamic(() => import("react-plotly.js"), { 
  ssr: false,
  loading: () => <div className="flex h-[450px] items-center justify-center bg-slate-50 rounded-md text-slate-400">Initializing Chart...</div>
});

interface Props {
  frontier: FrontierPoint[];
  maxSharpe?: FrontierPoint | null;
  riskParity?: FrontierPoint | null;
  assetsKey: string;
}

export function EfficientFrontierChart({ frontier, maxSharpe, riskParity, assetsKey }: Props) {
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);
  const selectedPoint = useSimulationStore((state) => state.selectedPoint);
  const [revision, setRevision] = useState(0);
  const plotRef = useRef<any>(null);

  // SYNC: When selectedPoint changes (even from buttons), trigger a redraw
  useEffect(() => {
    setRevision(prev => prev + 1);
  }, [selectedPoint]);

  // Keep data fresh for the event listener
  const dataRef = useRef({ frontier, maxSharpe, riskParity, setSelectedPoint });
  useEffect(() => {
    dataRef.current = { frontier, maxSharpe, riskParity, setSelectedPoint };
  }, [frontier, maxSharpe, riskParity, setSelectedPoint]);

  const data = useMemo(() => [
    {
      x: frontier.map((p) => p.volatility),
      y: frontier.map((p) => p.expected_return),
      mode: "lines+markers",
      type: "scatter" as const,
      name: "Efficient Frontier",
      marker: { size: 6, color: "#3b82f6" },
      line: { width: 2, color: "#3b82f6" },
      hovertemplate: "Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
    },
    ...(maxSharpe ? [{
      x: [maxSharpe.volatility],
      y: [maxSharpe.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: "Max Sharpe Ratio",
      marker: { size: 14, color: "#ef4444", symbol: "star" },
      hovertemplate: "<b>Max Sharpe</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
    }] : []),
    ...(riskParity ? [{
      x: [riskParity.volatility],
      y: [riskParity.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: "Risk Parity (ERC)",
      marker: { size: 14, color: "#10b981", symbol: "diamond" },
      hovertemplate: "<b>Risk Parity</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
    }] : []),
    ...(selectedPoint ? [{
      x: [selectedPoint.volatility],
      y: [selectedPoint.expected_return],
      mode: "markers",
      type: "scatter" as const,
      name: "Selection",
      marker: { size: 18, color: "rgba(0,0,0,0)", line: { color: "#f97316", width: 3 }, symbol: "circle" },
      hoverinfo: "none" as const,
      showlegend: false
    }] : []),
  ], [frontier, maxSharpe, riskParity, selectedPoint]);

  const layout = useMemo(() => ({
    autosize: true,
    height: 450,
    margin: { l: 60, r: 20, t: 40, b: 60 },
    xaxis: { title: "Risk (Volatility)", tickformat: ".1%", fixedrange: true },
    yaxis: { title: "Expected Return", tickformat: ".1%", fixedrange: true },
    dragmode: false as const,
    hovermode: "closest" as const,
    showlegend: true,
    legend: { orientation: "h" as const, y: -0.2 },
    plot_bgcolor: "white",
    paper_bgcolor: "white",
    datarevision: revision
  }), [revision]);

  // NATIVE EVENT HANDLER: Bypass React's synthetic events for Plotly
  const handleNativeClick = useCallback((eventData: any) => {
    if (!eventData || !eventData.points || eventData.points.length === 0) return;
    
    const clickedX = eventData.points[0].x;
    const { frontier, maxSharpe, riskParity, setSelectedPoint } = dataRef.current;
    
    const candidates = [
      ...(maxSharpe ? [maxSharpe] : []),
      ...(riskParity ? [riskParity] : []),
      ...frontier
    ];

    const nearest = candidates.reduce((prev, curr) => {
      return (Math.abs(curr.volatility - clickedX) < Math.abs(prev.volatility - clickedX)) ? curr : prev;
    });

    setSelectedPoint(nearest);
    setRevision(prev => prev + 1);
  }, []);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Efficient Frontier Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden rounded-md border border-slate-200 bg-white">
          <Plot
            key={assetsKey} 
            data={data}
            layout={layout}
            revision={revision}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
            onInitialized={(figure, graphDiv) => {
              plotRef.current = graphDiv;
              graphDiv.on('plotly_click', handleNativeClick);
            }}
            onUpdate={(figure, graphDiv) => {
              // Ensure listener is attached after updates
              graphDiv.removeAllListeners?.('plotly_click');
              graphDiv.on('plotly_click', handleNativeClick);
            }}
            config={{ responsive: true, displayModeBar: false }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

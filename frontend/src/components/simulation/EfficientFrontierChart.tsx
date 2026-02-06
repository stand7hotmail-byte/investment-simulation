"use client";

import dynamic from "next/dynamic";
import { FrontierPoint } from "@/types/simulation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSimulationStore } from "@/store/useSimulationStore";

// Dynamic import for Plotly
const Plot = dynamic(() => import("react-plotly.js"), { 
  ssr: false,
  loading: () => <div className="flex h-[400px] items-center justify-center bg-slate-100 rounded-md animate-pulse text-slate-400">Loading Chart...</div>
});

interface Props {
  frontier: FrontierPoint[];
  maxSharpe?: FrontierPoint | null;
  riskParity?: FrontierPoint | null;
}

export function EfficientFrontierChart({ frontier, maxSharpe, riskParity }: Props) {
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);

  const traceFrontier = {
    x: frontier.map((p) => p.volatility),
    y: frontier.map((p) => p.expected_return),
    mode: "lines+markers",
    type: "scatter" as const,
    name: "Efficient Frontier",
    marker: { size: 6, color: "#3b82f6" },
    line: { width: 3, color: "#3b82f6" },
    hovertemplate: "Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
  };

  const traceMaxSharpe = maxSharpe ? {
    x: [maxSharpe.volatility],
    y: [maxSharpe.expected_return],
    mode: "markers",
    type: "scatter" as const,
    name: "Max Sharpe Ratio",
    marker: { size: 12, color: "#ef4444", symbol: "star" },
    hovertemplate: "<b>Max Sharpe</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
  } : null;

  const traceRiskParity = riskParity ? {
    x: [riskParity.volatility],
    y: [riskParity.expected_return],
    mode: "markers",
    type: "scatter" as const,
    name: "Risk Parity (ERC)",
    marker: { size: 12, color: "#10b981", symbol: "diamond" },
    hovertemplate: "<b>Risk Parity</b><br>Risk: %{x:.2%}<br>Return: %{y:.2%}<extra></extra>",
  } : null;

  const data = [
    traceFrontier,
    ...(traceMaxSharpe ? [traceMaxSharpe] : []),
    ...(traceRiskParity ? [traceRiskParity] : []),
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Efficient Frontier Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden rounded-md border border-slate-200 bg-white">
          <Plot
            data={data}
            layout={{
              autosize: true,
              height: 450,
              margin: { l: 60, r: 20, t: 40, b: 60 },
              xaxis: { 
                title: "Risk (Standard Deviation)", 
                tickformat: ".1%",
                hoverformat: ".2%",
                gridcolor: "#f1f5f9"
              },
              yaxis: { 
                title: "Expected Return", 
                tickformat: ".1%",
                hoverformat: ".2%",
                gridcolor: "#f1f5f9"
              },
              hovermode: "closest",
              showlegend: true,
              legend: { orientation: "h", y: -0.2 },
              plot_bgcolor: "white",
              paper_bgcolor: "white",
            }}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
            onClick={(event) => {
              const point = event.points[0];
              const curveName = (point.data as any).name;

              if (curveName === "Efficient Frontier") {
                setSelectedPoint(frontier[point.pointIndex]);
              } else if (curveName === "Max Sharpe Ratio" && maxSharpe) {
                setSelectedPoint(maxSharpe);
              } else if (curveName === "Risk Parity (ERC)" && riskParity) {
                setSelectedPoint(riskParity);
              }
            }}
            config={{
              responsive: true,
              displayModeBar: false,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

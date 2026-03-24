"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { 
  Loader2, 
  AlertTriangle,
  TrendingDown
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Plotly must be loaded dynamically for Next.js SSR
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface StressTestProps {
  portfolioId: string;
}

interface StressTestScenario {
  name: string;
  max_drawdown: number;
  history: { date: string; cumulative_return: number }[];
}

interface StressTestResponse {
  [key: string]: StressTestScenario;
}

export function StressTestView({ portfolioId }: StressTestProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>("lehman_shock");

  const { data: stressData, isLoading, isError } = useQuery<StressTestResponse>({
    queryKey: ["portfolio-stress-test", portfolioId],
    queryFn: () => fetchApi(`/api/portfolios/${portfolioId}/analytics/stress-test`),
  });

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center border rounded-xl bg-slate-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (isError || !stressData) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl text-destructive bg-destructive/5">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="font-semibold">Failed to load stress test data.</p>
      </div>
    );
  }

  const scenario = stressData[selectedScenario];
  const maxDrawdownPct = (scenario.max_drawdown * 100).toFixed(2);

  // Prepare plot data
  const plotData = [{
    x: scenario.history.map((p: any) => p.date),
    y: scenario.history.map((p: any) => p.cumulative_return * 100),
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Portfolio Return',
    line: { color: 'rgb(225, 29, 72)', width: 3 },
    fill: 'tozeroy' as const,
    fillcolor: 'rgba(225, 29, 72, 0.1)'
  }];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(stressData).map(([key, data]: [string, any]) => (
          <button
            key={key}
            onClick={() => setSelectedScenario(key)}
            className={cn(
              "p-4 rounded-xl border text-left transition-all hover:shadow-md",
              selectedScenario === key 
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-slate-900 border-slate-200"
            )}
          >
            <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">{data.name}</div>
            <div className="text-xl font-bold">{(data.max_drawdown * -100).toFixed(1)}%</div>
            <div className="text-xs mt-1 opacity-80">Max Drawdown</div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>{scenario.name} Scenario</CardTitle>
            <CardDescription>
              How your current portfolio would have performed during this crisis.
            </CardDescription>
          </div>
          <div className="flex items-center text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-full text-sm">
            <TrendingDown className="h-4 w-4 mr-1" />
            {maxDrawdownPct}% Drop
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full bg-slate-50/50 rounded-xl overflow-hidden">
            <Plot
              data={plotData}
              layout={{
                autosize: true,
                margin: { l: 40, r: 20, t: 10, b: 40 },
                xaxis: { title: { text: "Date" }, gridcolor: "#f1f5f9" },
                yaxis: { title: { text: "Cumulative Return (%)" }, gridcolor: "#f1f5f9" },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                hovermode: 'closest'
              }}
              config={{ responsive: true, displayModeBar: false }}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

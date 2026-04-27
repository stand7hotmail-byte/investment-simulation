"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { CHART_COLORS, createChartLayout, CHART_CONFIG } from "@/lib/chart-utils";

const Plot = dynamic(() => import("react-plotly.js"), { 
  ssr: false,
  loading: () => <div className="flex h-[400px] items-center justify-center bg-slate-50 rounded-md text-slate-400">Initializing Chart...</div>
});

interface AccumulationChartProps {
  history: Array<{ year: number; value: number }>;
}

export function AccumulationChart({ history }: AccumulationChartProps) {
  const { t } = useI18n();

  const chartData = (history && history.length > 0) ? [
    {
      x: history.map(h => h.year),
      y: history.map(h => h.value),
      type: 'scatter',
      mode: 'lines+markers',
      name: t('simulation.value'),
      line: { color: CHART_COLORS.primary, width: 3 },
      marker: { color: CHART_COLORS.primary, size: 6 },
      hovertemplate: `${t('simulation.year', { year: '%{x}' })}: ¥%{y:,.0f}<extra></extra>`,
    }
  ] : [];

  const layout = createChartLayout({
    xAxisTitle: t('simulation.period'),
    yAxisTitle: `${t('simulation.value')} (¥)`,
    hovermode: 'x unified'
  });
  
  // Custom format for y-axis ticks
  (layout.yaxis as any).tickformat = ',.0f';

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl">{t('simulation.growthProjection')}</CardTitle>
          <Info className="h-4 w-4 text-slate-400" />
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="w-full bg-white">
          <Plot
            data={chartData as any}
            layout={layout as any}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
            config={CHART_CONFIG}
          />
        </div>
      </CardContent>
    </Card>
  );
}

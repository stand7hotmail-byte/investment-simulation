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
  DollarSign,
  TrendingUp
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/hooks/useI18n";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface DividendViewProps {
  portfolioId: string;
}

interface SimulationHistoryPoint {
  year: number;
  p10: number;
  p50: number;
  p90: number;
  p50_dividend: number;
  p50_cumulative_dividend: number;
}

interface MonteCarloResponse {
  percentiles: Record<string, number>;
  元本割れ確率: number;
  目標到達確率: number | null;
  history: SimulationHistoryPoint[];
  confidence_interval_95: { lower_bound: number; upper_bound: number } | null;
  total_dividends_p50: number;
}

export function DividendView({ portfolioId }: DividendViewProps) {
  const [initialInvestment, setInitialInvestment] = useState(1000000); // 1M JPY
  const [monthlyContribution, setMonthlyContribution] = useState(50000); // 50k JPY
  const [years, setYears] = useState(20);
  const { t, lang } = useI18n();

  // Simulation: With Reinvestment
  const { data: simWithReinvest, isLoading: loading1 } = useQuery<MonteCarloResponse>({
    queryKey: ["monte-carlo-reinvest", portfolioId, initialInvestment, monthlyContribution, years],
    queryFn: () => fetchApi("/api/simulate/monte-carlo", {
      method: "POST",
      body: JSON.stringify({
        portfolio_id: portfolioId,
        initial_investment: initialInvestment,
        monthly_contribution: monthlyContribution,
        years: years,
        reinvest_dividends: true
      })
    }),
  });

  // Simulation: No Reinvestment (Income Focus)
  const { data: simNoReinvest, isLoading: loading2 } = useQuery<MonteCarloResponse>({
    queryKey: ["monte-carlo-income", portfolioId, initialInvestment, monthlyContribution, years],
    queryFn: () => fetchApi("/api/simulate/monte-carlo", {
      method: "POST",
      body: JSON.stringify({
        portfolio_id: portfolioId,
        initial_investment: initialInvestment,
        monthly_contribution: monthlyContribution,
        years: years,
        reinvest_dividends: false
      })
    }),
  });

  if (loading1 || loading2) {
    return (
      <div className="flex h-64 items-center justify-center border rounded-xl bg-slate-50/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">{t('simulation.runningMc')}</p>
        </div>
      </div>
    );
  }

  const incomeHistory = simNoReinvest?.history || [];
  const reinvestHistory = simWithReinvest?.history || [];

  const yearLabel = lang === 'ja' ? '年' : 'Year';
  const currencySymbol = lang === 'ja' ? '¥' : '$';

  // Data for Dividend Income Bar Chart
  const dividendPlotData = [{
    x: incomeHistory.map((h: any) => `${yearLabel} ${h.year}`),
    y: incomeHistory.map((h: any) => h.p50_dividend),
    type: 'bar' as const,
    name: t('simulation.annualDividends'),
    marker: { color: 'rgb(16, 185, 129)' }
  }];

  // Data for Portfolio Comparison Line Chart
  const comparisonPlotData = [
    {
      x: reinvestHistory.map((h: any) => `${yearLabel} ${h.year}`),
      y: reinvestHistory.map((h: any) => h.p50),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: t('simulation.reinvestedReturn'),
      line: { color: 'rgb(59, 130, 246)', width: 3 }
    },
    {
      x: incomeHistory.map((h: any) => `${yearLabel} ${h.year}`),
      y: incomeHistory.map((h: any) => h.p50),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: t('simulation.incomeFocused'),
      line: { color: 'rgb(245, 158, 11)', width: 3, dash: 'dot' as const }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Controls */}
      <Card className="bg-slate-50/50 border-none">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>{t('simulation.initialInvestment')}</Label>
                <span className="font-bold text-primary">{currencySymbol}{initialInvestment.toLocaleString()}</span>
              </div>
              <Slider
                value={[initialInvestment]}
                min={0}
                max={10000000}
                step={100000}
                onValueChange={(v) => setInitialInvestment(v[0])}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>{t('simulation.monthlySaving')}</Label>
                <span className="font-bold text-primary">{currencySymbol}{monthlyContribution.toLocaleString()}</span>
              </div>
              <Slider
                value={[monthlyContribution]}
                min={0}
                max={1000000}
                step={10000}
                onValueChange={(v) => setMonthlyContribution(v[0])}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>{t('simulation.yearsToSimulate')}</Label>
                <span className="font-bold text-primary">{years} {t('simulation.period').replace('（年）', '')}</span>
              </div>
              <Slider
                value={[years]}
                min={1}
                max={40}
                onValueChange={(v) => setYears(v[0])}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dividend Income Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              {t('simulation.projectedDividendTitle')}
            </CardTitle>
            <CardDescription>{t('simulation.projectedDividendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full bg-slate-50/50 rounded-xl overflow-hidden">
              <Plot
                data={dividendPlotData}
                layout={{
                  autosize: true,
                  margin: { l: 60, r: 20, t: 10, b: 40 },
                  xaxis: { title: { text: t('common.time') } },
                  yaxis: { title: { text: `${t('common.amount')} (${currencySymbol})` } },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                }}
                config={{ responsive: true, displayModeBar: false }}
                className="w-full h-full"
              />
            </div>
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-800" dangerouslySetInnerHTML={{ 
                __html: t('simulation.dividendSummaryText', { 
                  years: years, 
                  amount: incomeHistory[years]?.p50_dividend.toLocaleString(undefined, { maximumFractionDigits: 0 }) 
                }) 
              }} />
            </div>
          </CardContent>
        </Card>

        {/* Wealth Accumulation Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {t('simulation.reinvestmentImpactTitle')}
            </CardTitle>
            <CardDescription>{t('simulation.reinvestmentImpactDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full bg-slate-50/50 rounded-xl overflow-hidden">
              <Plot
                data={comparisonPlotData}
                layout={{
                  autosize: true,
                  margin: { l: 60, r: 20, t: 10, b: 40 },
                  xaxis: { title: { text: t('common.time') } },
                  yaxis: { title: { text: `${t('common.totalValue')} (${currencySymbol})` } },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  legend: { orientation: 'h', y: -0.2 }
                }}
                config={{ responsive: true, displayModeBar: false }}
                className="w-full h-full"
              />
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800" dangerouslySetInnerHTML={{
                __html: t('simulation.reinvestmentSummaryText', {
                  amount: (reinvestHistory[years]?.p50 - incomeHistory[years]?.p50).toLocaleString(undefined, { maximumFractionDigits: 0 })
                })
              }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

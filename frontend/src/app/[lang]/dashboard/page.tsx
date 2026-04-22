"use client";

import Link from "next/link";
import { 
  TrendingUp, 
  LineChart, 
  Wallet, 
  Plus, 
  History,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMarketSummary, MarketSummaryItem } from "@/hooks/useMarketSummary";
import { useSimulationResults } from "@/hooks/useSimulationResults";
import { cn, formatSafeDate } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";
import { formatFinancialValue } from "@/lib/i18n";

export default function DashboardPage() {
  const { data: marketData, isLoading: marketLoading } = useMarketSummary();
  const { simulationResults: historyData, isLoading: historyLoading } = useSimulationResults();
  const { t, lang } = useI18n();

  const recentHistory = historyData?.slice(0, 5) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('dashboard.title')}</h1>
        <p className="text-slate-500 text-lg">
          {t('dashboard.welcomeBack')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Market Summary - Left Column (Main) */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl">{t('dashboard.marketSummary')}</CardTitle>
                <CardDescription>{t('dashboard.marketPerformance')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {marketLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                </div>
              ) : marketData?.items && marketData.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketData.items.map((item) => (
                    <MarketItemCard key={item.asset_code} item={item} lang={lang} />
                  ))}
                </div>
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed text-slate-400">
                  <p>{t('dashboard.noMarketData')}</p>
                  <p className="text-xs">Make sure backend is running and seeded</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('dashboard.quickActions')}</CardTitle>
              <CardDescription>{t('dashboard.quickActionsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-24 flex-col gap-2 border-dashed">
                  <Link href={`/${lang}/simulation/efficient-frontier`}>
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                    <span>{t('dashboard.newFrontier')}</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col gap-2 border-dashed">
                  <Link href={`/${lang}/simulation/accumulation`}>
                    <LineChart className="h-6 w-6 text-indigo-500" />
                    <span>{t('dashboard.newMonteCarlo')}</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-24 flex-col gap-2 border-dashed">
                  <Link href={`/${lang}/portfolios`}>
                    <Wallet className="h-6 w-6 text-emerald-500" />
                    <span>{t('dashboard.managePortfolios')}</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Column - Right */}
        <div className="space-y-8">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">{t('dashboard.recentActivity')}</CardTitle>
                <CardDescription>{t('dashboard.savedSims')}</CardDescription>
              </div>
              <History className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-4">
              {historyLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              ) : recentHistory.length > 0 ? (
                <div className="space-y-4">
                  {recentHistory.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold truncate max-w-[150px]">
                          {result.simulation_type === "risk_parity" ? "Risk Parity" : "Simulation"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatSafeDate(result.created_at, "MMM d, yyyy")}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/${lang}/simulation/history?id=${result.id}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed text-slate-400 text-sm">
                  <p>{t('dashboard.noRecentActivity')}</p>
                  <Button variant="link" size="sm" asChild className="h-auto p-0 mt-2">
                    <Link href={`/${lang}/simulation/efficient-frontier`}>{t('dashboard.startFirstSim')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
            {recentHistory.length > 0 && (
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full text-slate-500 text-xs" asChild>
                  <Link href={`/${lang}/simulation/history`}>{t('dashboard.viewFullHistory')}</Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MarketItemCard({ item, lang }: { item: MarketSummaryItem, lang: string }) {
  const isPositive = item.change_percentage >= 0;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="space-y-1">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.asset_code}</div>
        <div className="text-lg font-bold">{formatFinancialValue(item.current_price, 'USD', lang)}</div>
        <div className={cn(
          "flex items-center text-xs font-semibold",
          isPositive ? "text-emerald-600" : "text-rose-600"
        )}>
          {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
          {Math.abs(item.change_percentage).toFixed(2)}%
        </div>
      </div>
      
      {/* Mini Sparkline using SVG */}
      <div className="h-10 w-24">
        {item.sparkline && item.sparkline.length > 0 && (
          <Sparkline data={item.sparkline} color={isPositive ? "rgb(16 185 129)" : "rgb(225 29 72)"} />
        )}
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[], color: string }) {
  if (!data || data.length < 2) {
    return <div className="w-full h-full bg-slate-100/50 rounded animate-pulse" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 40;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

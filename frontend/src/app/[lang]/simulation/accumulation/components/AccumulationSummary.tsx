"use client";

import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { BasicAccumulationResponse } from "@/types/simulation";

interface AccumulationSummaryProps {
  results: BasicAccumulationResponse;
}

export function AccumulationSummary({ results }: AccumulationSummaryProps) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-none shadow-sm bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardDescription className="text-primary-foreground/70 uppercase text-xs font-bold tracking-wider">
            {t('simulation.finalValue')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              ¥{results.final_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <TrendingUp className="h-6 w-6 text-primary-foreground/50" />
          </div>
        </CardContent>
      </Card>

      {results.confidence_interval_95 && (
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 uppercase text-xs font-bold tracking-wider">
              {t('simulation.confidence95')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center">
            <div className="text-sm font-medium text-slate-900">
              {t('simulation.lowerBound')}: <span className="text-rose-600 font-bold">¥{results.confidence_interval_95.lower_bound.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="text-sm font-medium text-slate-900">
              {t('simulation.upperBound')}: <span className="text-emerald-600 font-bold">¥{results.confidence_interval_95.upper_bound.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

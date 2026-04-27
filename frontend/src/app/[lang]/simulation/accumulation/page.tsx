"use client";

import { useState } from "react";
import { usePortfolios } from "@/hooks/usePortfolios";
import { fetchApi } from "@/lib/api";
import { BasicAccumulationResponse } from "@/types/simulation";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { AffiliateSection } from "@/components/simulation/AffiliateSection";
import { useI18n } from "@/hooks/useI18n";

import { AccumulationForm } from "./components/AccumulationForm";
import { AccumulationChart } from "./components/AccumulationChart";
import { AccumulationSummary } from "./components/AccumulationSummary";

export default function AccumulationPage() {
  const { t } = useI18n();

  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();
  const [results, setResults] = useState<BasicAccumulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const onSubmit = async (data: any) => {
    setIsSimulating(true);
    try {
      const response = await fetchApi<BasicAccumulationResponse>("/api/simulate/basic-accumulation", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setResults(response);
    } catch (error: any) {
      toast.error(`${t('common.error')}: ${error.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('simulation.accTitle')}</h1>
        <p className="text-slate-500 text-lg">
          {t('simulation.accSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-4 space-y-6">
          <AccumulationForm 
            portfolios={portfolios} 
            isLoading={portfoliosLoading} 
            isSimulating={isSimulating} 
            onSubmit={onSubmit} 
          />
        </div>

        {/* Results Section */}
        <div className="lg:col-span-8 space-y-6">
          {results ? (
            <div className="space-y-6">
              <AccumulationSummary results={results} />
              <AccumulationChart history={results.history} />
            </div>
          ) : (
            <Card className="h-full min-h-[500px] flex flex-col items-center justify-center border-dashed border-2 bg-white/50 text-center border-slate-200">
              <div className="max-w-xs space-y-4 px-6">
                <div className="bg-white shadow-sm w-20 h-20 rounded-3xl flex items-center justify-center mx-auto">
                  <TrendingUp className="h-10 w-10 text-primary/40" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-slate-900">
                    {t('simulation.readyTitle')}
                  </p>
                  <p className="text-slate-500">
                    {t('simulation.readyDesc')}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Affiliate Recommendations */}
      <div className="max-w-6xl mx-auto py-12 px-4 border-t border-slate-200 mt-12">
        <AffiliateSection />
      </div>
    </div>
  );
}

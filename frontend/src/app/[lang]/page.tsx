"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, LineChart, Wallet, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AssetHistoricalChart } from "@/components/charts/AssetHistoricalChart";
import { useI18n } from "@/hooks/useI18n";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { t, lang } = useI18n();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(`/${lang}/dashboard`);
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router, lang]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-10">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          {t('landing.heroTitle')}
        </h1>
        <p className="text-slate-500 text-xl max-w-2xl">
          {t('landing.heroSubtitle')}
        </p>
        <div className="flex gap-4 pt-4">
          <Button size="lg" asChild className="px-8 py-6 text-lg">
            <Link href={`/${lang}/signup`}>{t('landing.getStarted')} <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="px-8 py-6 text-lg">
            <Link href={`/${lang}/login`}>{t('landing.login')}</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader>
            <TrendingUp className="h-10 w-10 text-blue-500 mb-2" />
            <CardTitle className="text-xl">{t('landing.efficientFrontierTitle')}</CardTitle>
            <CardDescription className="text-sm">
              {t('landing.efficientFrontierDesc')}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader>
            <LineChart className="h-10 w-10 text-indigo-500 mb-2" />
            <CardTitle className="text-xl">{t('landing.monteCarloTitle')}</CardTitle>
            <CardDescription className="text-sm">
              {t('landing.monteCarloDesc')}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardHeader>
            <Wallet className="h-10 w-10 text-emerald-500 mb-2" />
            <CardTitle className="text-xl">{t('landing.portfolioMgmtTitle')}</CardTitle>
            <CardDescription className="text-sm">
              {t('landing.portfolioMgmtDesc')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="pt-10 border-t border-slate-200">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-8 text-center">{t('landing.marketHighlights')}</h2>
        <div className="bg-white p-8 rounded-3xl shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-4">SPY (S&P 500 ETF) Performance</h3>
          <AssetHistoricalChart assetCode="SPY" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Settings, 
  TrendingUp, 
  PieChart, 
  Zap,
  DollarSign,
  History as HistoryIcon
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StressTestView } from "./components/StressTestView";
import { RebalanceView } from "./components/RebalanceView";
import { DividendView } from "./components/DividendView";

interface PortfolioAllocation {
  asset_code: string;
  weight: number;
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  allocations: PortfolioAllocation[];
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: portfolio, isLoading, isError } = useQuery<Portfolio>({
    queryKey: ["portfolio", id],
    queryFn: () => fetchApi(`/api/portfolios/${id}`),
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !portfolio) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 text-center">
        <h1 className="text-2xl font-bold text-destructive">Error</h1>
        <p className="text-muted-foreground">Portfolio not found or failed to load.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="p-0 hover:bg-transparent">
              <Link href="/portfolios" className="text-muted-foreground hover:text-primary flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" /> Portfolios
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{portfolio.name}</h1>
          <p className="text-muted-foreground text-lg">{portfolio.description || "Portfolio analysis and overview"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/portfolios/${id}/edit`}>
              <Settings className="mr-2 h-4 w-4" /> Edit Details
            </Link>
          </Button>
          <Button asChild>
            <Link href="/simulation/efficient-frontier">
              <Zap className="mr-2 h-4 w-4" /> New Simulation
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" /> Allocations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Advanced Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolio.allocations?.length || 0} Assets</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Historical simulation and projected returns</CardDescription>
            </CardHeader>
            <CardContent>
              <DividendView portfolioId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Mix</CardTitle>
              <CardDescription>Current weight distribution of your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.allocations?.map((alloc: any) => (
                  <div key={alloc.asset_code} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <div className="font-semibold">{alloc.asset_code}</div>
                      <div className="text-xs text-muted-foreground">Weight: {(alloc.weight * 100).toFixed(2)}%</div>
                    </div>
                    <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${alloc.weight * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8 pt-4">
          <div className="grid grid-cols-1 gap-12">
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="text-rose-600" /> Historical Stress Test
              </h2>
              <StressTestView portfolioId={id} />
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HistoryIcon className="text-amber-600" /> Rebalancing Advice
              </h2>
              <RebalanceView portfolioId={id} allocations={portfolio.allocations} />
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <DollarSign className="text-emerald-600" /> Future Income Projection
              </h2>
              <DividendView portfolioId={id} />
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

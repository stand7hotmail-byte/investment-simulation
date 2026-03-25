"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePortfolios } from "@/hooks/usePortfolios";
import { fetchApi } from "@/lib/api";
import { BasicAccumulationResponse } from "@/types/simulation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { TrendingUp, Wallet, Calendar, Calculator, Info } from "lucide-react";
import { AffiliateSection } from "@/components/simulation/AffiliateSection";

const Plot = dynamic(() => import("react-plotly.js"), { 
  ssr: false,
  loading: () => <div className="flex h-[400px] items-center justify-center bg-slate-50 rounded-md text-slate-400">Initializing Chart...</div>
});

const formSchema = z.object({
  portfolio_id: z.string().min(1, "Please select a portfolio"),
  initial_investment: z.number().min(0, "Initial investment must be at least 0"),
  monthly_contribution: z.number().min(0, "Monthly contribution must be at least 0"),
  years: z.number().int().min(1, "Period must be at least 1 year").max(50, "Period must be 50 years or less"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AccumulationPage() {
  const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();
  const [results, setResults] = useState<BasicAccumulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initial_investment: 1000000,
      monthly_contribution: 30000,
      years: 20,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSimulating(true);
    try {
      const response = await fetchApi<BasicAccumulationResponse>("/api/simulate/basic-accumulation", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setResults(response);
    } catch (error: any) {
      toast.error(`Simulation failed: ${error.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const chartData = (results?.history && results.history.length > 0) ? [
    {
      x: results.history.map(h => h.year),
      y: results.history.map(h => h.value),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Projected Value',
      line: { color: 'rgb(59 130 246)', width: 3 },
      marker: { color: 'rgb(59 130 246)', size: 6 },
      hovertemplate: 'Year %{x}: ¥%{y:,.0f}<extra></extra>',
    }
  ] : [];

  const layout = {
    autosize: true,
    height: 400,
    margin: { l: 80, r: 20, t: 20, b: 60 },
    xaxis: { title: { text: 'Years' }, fixedrange: true, gridcolor: "#f1f5f9" },
    yaxis: { title: { text: 'Value (¥)' }, tickformat: ',.0f', fixedrange: true, gridcolor: "#f1f5f9" },
    hovermode: 'x unified' as const,
    plot_bgcolor: "white",
    paper_bgcolor: "white",
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Accumulation Sim</h1>
        <p className="text-slate-500 text-lg">
          Estimate the future value of your portfolio based on initial investment and monthly contributions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg">Parameters</CardTitle>
              </div>
              <CardDescription>Configure your investment plan</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="portfolio_id" className="text-sm font-medium">
                    Target Portfolio
                  </Label>
                  <select
                    id="portfolio_id"
                    {...register("portfolio_id")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a portfolio...</option>
                    {portfolios?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {errors.portfolio_id && <p className="text-xs text-destructive">{errors.portfolio_id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial_investment" className="text-sm font-medium">
                    Initial Investment (¥)
                  </Label>
                  <Input
                    id="initial_investment"
                    type="number"
                    className="h-10"
                    {...register("initial_investment", { valueAsNumber: true })}
                  />
                  {errors.initial_investment && <p className="text-xs text-destructive">{errors.initial_investment.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_contribution" className="text-sm font-medium">
                    Monthly Contribution (¥)
                  </Label>
                  <Input
                    id="monthly_contribution"
                    type="number"
                    className="h-10"
                    {...register("monthly_contribution", { valueAsNumber: true })}
                  />
                  {errors.monthly_contribution && <p className="text-xs text-destructive">{errors.monthly_contribution.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years" className="text-sm font-medium">
                    Period (Years)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="years"
                      type="number"
                      className="h-10"
                      {...register("years", { valueAsNumber: true })}
                    />
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  {errors.years && <p className="text-xs text-destructive">{errors.years.message}</p>}
                </div>

                <Button type="submit" className="w-full h-11 text-base font-medium shadow-sm" disabled={isSimulating || portfoliosLoading}>
                  {isSimulating ? "Calculating..." : "Run Simulation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-8 space-y-6">
          {results ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-primary-foreground/70 uppercase text-xs font-bold tracking-wider">
                      Projected Final Value
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
                        95% Confidence Range
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center">
                      <div className="text-sm font-medium text-slate-900">
                        Lower: <span className="text-rose-600 font-bold">¥{results.confidence_interval_95.lower_bound.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-900">
                        Upper: <span className="text-emerald-600 font-bold">¥{results.confidence_interval_95.upper_bound.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">Growth Projection</CardTitle>
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
                      config={{ responsive: true, displayModeBar: false }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full min-h-[500px] flex flex-col items-center justify-center border-dashed border-2 bg-white/50 text-center border-slate-200">
              <div className="max-w-xs space-y-4 px-6">
                <div className="bg-white shadow-sm w-20 h-20 rounded-3xl flex items-center justify-center mx-auto">
                  <TrendingUp className="h-10 w-10 text-primary/40" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-slate-900">
                    Ready to Simulate
                  </p>
                  <p className="text-slate-500">
                    Select a portfolio and enter your investment goals to see how your wealth could grow over time.
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

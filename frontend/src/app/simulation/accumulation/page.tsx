"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePortfolios } from "@/hooks/usePortfolios";
import { fetchApi } from "@/lib/api";
import { BasicAccumulationResponse, BasicAccumulationRequest } from "@/types/simulation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { TrendingUp, Wallet, Calendar } from "lucide-react";

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

  const chartData = results ? [
    {
      x: results.history.map(h => h.year),
      y: results.history.map(h => h.value),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Projected Value',
      line: { color: '#10b981', width: 3 },
      marker: { color: '#10b981', size: 6 },
      hovertemplate: 'Year %{x}: ¥%{y:,.0f}<extra></extra>',
    }
  ] : [];

  const layout = {
    autosize: true,
    height: 400,
    margin: { l: 80, r: 20, t: 40, b: 60 },
    xaxis: { title: 'Years', fixedrange: true },
    yaxis: { title: 'Portfolio Value (¥)', tickformat: ',.0f', fixedrange: true },
    hovermode: 'x unified' as const,
    plot_bgcolor: "white",
    paper_bgcolor: "white",
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Accumulation Simulation</h1>
        <p className="text-slate-500">
          Estimate the future value of your portfolio based on initial investment and monthly contributions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Simulation Parameters</CardTitle>
              <CardDescription>Enter your investment details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portfolio_id" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" /> Select Portfolio
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
                  <Label htmlFor="initial_investment" className="flex items-center gap-2">
                    ¥ Initial Investment
                  </Label>
                  <Input
                    id="initial_investment"
                    type="number"
                    {...register("initial_investment", { valueAsNumber: true })}
                  />
                  {errors.initial_investment && <p className="text-xs text-destructive">{errors.initial_investment.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly_contribution" className="flex items-center gap-2">
                    ¥ Monthly Contribution
                  </Label>
                  <Input
                    id="monthly_contribution"
                    type="number"
                    {...register("monthly_contribution", { valueAsNumber: true })}
                  />
                  {errors.monthly_contribution && <p className="text-xs text-destructive">{errors.monthly_contribution.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Investment Period (Years)
                  </Label>
                  <Input
                    id="years"
                    type="number"
                    {...register("years", { valueAsNumber: true })}
                  />
                  {errors.years && <p className="text-xs text-destructive">{errors.years.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSimulating || portfoliosLoading}>
                  {isSimulating ? "Calculating..." : "Run Simulation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <>
              <Card className="bg-emerald-50 border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-emerald-900 text-sm font-medium uppercase tracking-wider">Projected Final Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-emerald-700">
                      ¥{results.final_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Confidence Interval Display */}
              {results.confidence_interval_95 && (
                <Card className="bg-blue-50 border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-900 text-sm font-medium uppercase tracking-wider">
                      95% Confidence Interval (Final Value)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-1">
                      <p className="text-lg text-blue-700">
                        Lower Bound: ¥{results.confidence_interval_95.lower_bound.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-lg text-blue-700">
                        Upper Bound: ¥{results.confidence_interval_95.upper_bound.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Growth Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-hidden rounded-md border border-slate-100 bg-white">
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
            </>
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-center p-8 shadow-inner">
              <div className="max-w-xs space-y-4">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-slate-300" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-slate-500">
                    Ready to Simulate
                  </p>
                  <p className="text-sm">
                    Select a portfolio and enter your investment goals to see how your wealth could grow over time.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

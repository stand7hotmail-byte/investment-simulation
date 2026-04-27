"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Calendar } from "lucide-react";
import { Portfolio } from "@/types/portfolio";
import { useI18n } from "@/hooks/useI18n";

interface AccumulationFormProps {
  portfolios: Portfolio[] | undefined;
  isLoading: boolean;
  isSimulating: boolean;
  onSubmit: (data: any) => void;
}

export function AccumulationForm({ portfolios, isLoading, isSimulating, onSubmit }: AccumulationFormProps) {
  const { t } = useI18n();

  const formSchema = z.object({
    portfolio_id: z.string().min(1, t('common.error')),
    initial_investment: z.number().min(0),
    monthly_contribution: z.number().min(0),
    years: z.number().int().min(1).max(50),
  });

  type FormValues = z.infer<typeof formSchema>;

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

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-lg">{t('simulation.parameters')}</CardTitle>
        </div>
        <CardDescription>{t('simulation.paramsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="portfolio_id" className="text-sm font-medium">
              {t('simulation.targetPortfolio')}
            </Label>
            <select
              id="portfolio_id"
              {...register("portfolio_id")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{t('simulation.selectPortfolio')}</option>
              {portfolios?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.portfolio_id && <p className="text-xs text-destructive">{t('simulation.selectPortfolio')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial_investment" className="text-sm font-medium">
              {t('simulation.initialInvestment')} (¥)
            </Label>
            <Input
              id="initial_investment"
              type="number"
              className="h-10"
              {...register("initial_investment", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_contribution" className="text-sm font-medium">
              {t('simulation.monthlyContribution')} (¥)
            </Label>
            <Input
              id="monthly_contribution"
              type="number"
              className="h-10"
              {...register("monthly_contribution", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="years" className="text-sm font-medium">
              {t('simulation.period')}
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
          </div>

          <Button type="submit" className="w-full h-11 text-base font-medium shadow-sm" disabled={isSimulating || isLoading}>
            {isSimulating ? t('simulation.calculating') : t('simulation.runSim')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

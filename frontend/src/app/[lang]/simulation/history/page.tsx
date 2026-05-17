"use client";

import { useSimulationResults } from "@/hooks/useSimulationResults";
import { formatSafeDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, History, ExternalLink, Box } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/useI18n";

export default function SimulationHistoryPage() {
  const { simulationResults, isLoading, error, deleteSimulationResult, loadSimulationResult } = useSimulationResults();
  const router = useRouter();
  const { t, lang } = useI18n();

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
        <p className="text-slate-400 font-medium">{t('history.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card className="border-rose-100 bg-rose-50/50">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-rose-600 font-medium">{t('history.errorLoading')}</p>
            <p className="text-xs text-rose-400">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>{t('history.tryAgain')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = (resultId: string) => {
    if (confirm(t('history.deleteConfirm'))) {
      deleteSimulationResult(resultId);
    }
  };

  const handleLoad = (result: any) => {
    loadSimulationResult(result);
    router.push(`/${lang}/simulation/efficient-frontier`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('history.title')}</h1>
        <p className="text-slate-500 text-lg">
          {t('history.subtitle')}
        </p>
      </div>

      {!simulationResults || simulationResults.length === 0 ? (
        <Card className="h-[400px] flex flex-col items-center justify-center border-dashed border-2 bg-white/50 text-center border-slate-200">
          <div className="max-w-xs space-y-4 px-6">
            <div className="bg-white shadow-sm w-20 h-20 rounded-3xl flex items-center justify-center mx-auto">
              <History className="h-10 w-10 text-primary/40" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-slate-900">{t('history.noHistoryTitle')}</p>
              <p className="text-slate-500">
                {t('history.noHistoryDesc')}
              </p>
              <Button asChild className="mt-4">
                <Link href={`/${lang}/simulation/efficient-frontier`}>{t('history.newSim')}</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t('history.savedResults')}</CardTitle>
            </div>
            <CardDescription>{t('history.viewDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[180px] px-6">{t('history.tableType')}</TableHead>
                  <TableHead className="px-6">{t('history.tableAssets')}</TableHead>
                  <TableHead className="px-6">{t('history.tableDate')}</TableHead>
                  <TableHead className="text-right px-6">{t('history.tableActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulationResults.map((result) => (
                  <TableRow key={result.id} className="group transition-colors hover:bg-slate-50/50">
                    <TableCell className="px-6">
                      <Badge variant="secondary" className="font-semibold uppercase text-[10px] tracking-wider px-2 bg-slate-100 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {result.simulation_type === "risk_parity" ? t('dashboard.simulationTypeRiskParity') : t('dashboard.simulationTypeSimulation')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6">
                      <div className="flex flex-wrap gap-1">
                        {result.parameters?.assets?.map((asset: string) => (
                          <span key={asset} className="text-xs font-medium text-slate-500">
                            {asset}
                          </span>
                        )).reduce((prev: any, curr: any) => [prev, <span key={curr.key+"-sep"} className="text-slate-300">·</span>, curr]) || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-slate-400 text-sm">
                      {formatSafeDate(result.created_at, "MMM d, yyyy · HH:mm")}
                    </TableCell>
                    <TableCell className="text-right px-6 space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600 hover:text-primary" onClick={() => handleLoad(result)}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>{t('history.view')}</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(result.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

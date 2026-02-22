"use client";

import { useSimulationResults } from "@/hooks/useSimulationResults";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SimulationHistoryPage() {
  const { simulationResults, isLoading, error, deleteSimulationResult, loadSimulationResult } = useSimulationResults();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading simulation history: {error.message}
      </div>
    );
  }

  if (!simulationResults || simulationResults.length === 0) {
    return (
      <div className="text-center text-slate-500 p-4">
        No simulation results saved yet.
      </div>
    );
  }

  const handleDelete = (resultId: string) => {
    if (confirm("Are you sure you want to delete this simulation result?")) {
      deleteSimulationResult(resultId);
    }
  };

  const handleLoad = (result: any) => {
    loadSimulationResult(result);
    router.push("/simulation/efficient-frontier"); // Navigate back to the efficient frontier page
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Simulation History</h1>
        <p className="text-slate-500">
          Review and manage your past simulation results.
        </p>
      </div>

      <Card className="w-full shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Saved Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {simulationResults.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.simulation_type}</TableCell>
                  <TableCell>{result.parameters.assets?.join(", ") || "N/A"}</TableCell>
                  <TableCell>{format(new Date(result.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleLoad(result)}>
                      Load
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(result.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

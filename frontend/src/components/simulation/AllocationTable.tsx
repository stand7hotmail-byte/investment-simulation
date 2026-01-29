"use client";

import { useSimulationStore } from "@/store/useSimulationStore";
import { useAssets } from "@/hooks/useAssets";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function AllocationTable() {
  const selectedPoint = useSimulationStore((state) => state.selectedPoint);
  const { data: assets } = useAssets();

  if (!selectedPoint) {
    return null;
  }

  // Helper to get asset name from code
  const getAssetName = (code: string) => {
    const asset = assets?.find((a) => a.asset_code === code);
    return asset ? asset.name : code;
  };

  // Sort weights by value descending
  const weights = Object.entries(selectedPoint.weights)
    .filter(([_, weight]) => weight > 0.0001) // Filter out negligible weights
    .sort(([_, a], [__, b]) => b - a);

  return (
    <Card className="w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Asset Allocation Details</span>
          <div className="flex space-x-4 text-sm font-normal text-slate-500">
            <span>Risk: {(selectedPoint.volatility * 100).toFixed(2)}%</span>
            <span>Return: {(selectedPoint.expected_return * 100).toFixed(2)}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Name</TableHead>
              <TableHead className="text-right">Allocation (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weights.map(([code, weight]) => (
              <TableRow key={code}>
                <TableCell className="font-medium">{getAssetName(code)}</TableCell>
                <TableCell className="text-right">
                  {(weight * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

"use client";

import { useAssets } from "@/hooks/useAssets";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function AssetSelector() {
  const { data: assets, isLoading, error } = useAssets();
  const { selectedAssetCodes, toggleAsset } = useSimulationStore();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">Error loading assets: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Select Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {isLoading ? (
              // Loading state with Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3" role="status">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              ))
            ) : (
              assets?.map((asset) => (
                <div key={asset.asset_code} className="flex items-center space-x-3">
                  <Checkbox
                    id={`asset-${asset.asset_code}`}
                    checked={selectedAssetCodes.includes(asset.asset_code)}
                    onCheckedChange={() => toggleAsset(asset.asset_code)}
                  />
                  <label
                    htmlFor={`asset-${asset.asset_code}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {asset.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

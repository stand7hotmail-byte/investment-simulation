"use client";

import { useState, useMemo } from "react";
import { useAssets } from "@/hooks/useAssets";
import { useSimulationStore } from "@/store/useSimulationStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AssetSelector() {
  const { data: assets, isLoading, error } = useAssets();
  const { selectedAssetCodes, toggleAsset } = useSimulationStore();
  const [activeFilter, setActiveFilter] = useState<string>("All");

  // Extract unique asset classes for filtering
  const assetClasses = useMemo(() => {
    if (!assets) return ["All"];
    const classes = new Set(assets.map((a) => a.asset_class).filter(Boolean));
    return ["All", ...Array.from(classes).sort()];
  }, [assets]);

  // Filter assets based on active filter
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    if (activeFilter === "All") return assets;
    return assets.filter((a) => a.asset_class === activeFilter);
  }, [assets, activeFilter]);

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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Select Assets</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {assetClasses.map((cls) => (
            <Button
              key={cls}
              variant="outline"
              size="xs"
              className={cn(
                "px-2.5 py-1 h-7 text-xs rounded-full transition-all",
                activeFilter === cls 
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
              onClick={() => setActiveFilter(cls)}
            >
              {cls}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {isLoading ? (
              // Loading state with Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3" role="status">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              ))
            ) : filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => (
                <div key={asset.asset_code} className="flex items-center space-x-3">
                  <Checkbox
                    id={`asset-${asset.asset_code}`}
                    checked={selectedAssetCodes.includes(asset.asset_code)}
                    onCheckedChange={() => toggleAsset(asset.asset_code)}
                  />
                  <label
                    htmlFor={`asset-${asset.asset_code}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {asset.name}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-8">
                No assets found for this category.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

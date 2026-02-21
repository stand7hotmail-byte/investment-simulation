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
    if (!assets || assets.length === 0) return ["All"];
    const classes = new Set(assets.map((a) => a.asset_class).filter(Boolean) as string[]);
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
          <p className="text-sm text-red-600 font-medium">Error loading assets</p>
          <p className="text-xs text-red-500 mt-1">{error.message}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 w-full bg-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-800">Select Assets</CardTitle>
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
                "px-2.5 py-1 h-7 text-xs rounded-full transition-all border",
                activeFilter === cls 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
              onClick={() => setActiveFilter(cls)}
            >
              {cls}
              {cls === "All" && assets && ` (${assets.length})`}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-3 pb-4">
            {isLoading ? (
              // Loading state with Skeletons
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 py-1" role="status">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-full max-w-[180px]" />
                </div>
              ))
            ) : filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => (
                <div key={asset.asset_code} className="flex items-center space-x-3 group py-0.5">
                  <Checkbox
                    id={`asset-${asset.asset_code}`}
                    checked={selectedAssetCodes.includes(asset.asset_code)}
                    onCheckedChange={() => toggleAsset(asset.asset_code)}
                    className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={`asset-${asset.asset_code}`}
                    className="text-sm font-medium leading-none text-slate-600 group-hover:text-slate-900 cursor-pointer transition-colors"
                  >
                    {asset.name}
                    <span className="text-[10px] text-slate-400 ml-1.5 font-normal uppercase tracking-wider">
                      {asset.asset_code}
                    </span>
                  </label>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <p className="text-sm italic">No assets found</p>
                {assets?.length === 0 && (
                  <p className="text-xs mt-2 text-slate-300">Database appears to be empty</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

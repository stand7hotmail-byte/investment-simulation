"use client";

import { useState, useMemo } from "react";
import { useAssets } from "@/hooks/useAssets";
import { useAssetClasses } from "@/hooks/useAssetClasses"; // New import
import { useSimulationStore } from "@/store/useSimulationStore";
import { Checkbox } from "@/components/ui/checkbox";
import { CircleX } from "lucide-react"; // New import for Clear button
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface AssetItemProps {
  asset: {
    asset_code: string;
    name: string;
  };
  isSelected: boolean;
  onToggle: (code: string) => void;
}

const AssetItem = React.memo(({ asset, isSelected, onToggle }: AssetItemProps) => {
  return (
    <div className="flex items-center space-x-3 group py-0.5">
      <Checkbox
        id={`asset-${asset.asset_code}`}
        checked={isSelected}
        onCheckedChange={() => onToggle(asset.asset_code)}
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
  );
});

AssetItem.displayName = "AssetItem";

export function AssetSelector() {
  const { data: assets, isLoading, error } = useAssets();
  const { data: availableAssetClasses, isLoading: isLoadingAssetClasses, error: errorAssetClasses } = useAssetClasses(); // Use new hook
  const { 
    selectedAssetCodes, 
    toggleAsset, 
    selectedAssetClasses, 
    toggleAssetClass,
    clearAssetClasses,
    setSelectedAssets // For clearing asset selections when filtering
  } = useSimulationStore();

  // Filter assets based on active filter
  const filteredAssets = useMemo(() => {
    if (!assets) return [];
    if (selectedAssetClasses.length === 0) return assets; // No filter selected, show all
    return assets.filter((asset) => 
      asset.asset_class && selectedAssetClasses.includes(asset.asset_class)
    );
  }, [assets, selectedAssetClasses]);

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
        {/* Filter Checkboxes for Asset Classes */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {isLoadingAssetClasses ? (
            <Skeleton className="h-7 w-full max-w-[200px]" />
          ) : (
            <>
              {availableAssetClasses?.map((cls) => (
                <Button
                  key={cls}
                  variant="outline"
                  size="xs"
                  className={cn(
                    "px-2.5 py-1 h-7 text-xs rounded-full transition-all border",
                    selectedAssetClasses.includes(cls)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  )}
                  onClick={() => toggleAssetClass(cls)}
                >
                  {cls}
                </Button>
              ))}
              {selectedAssetClasses.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="px-2.5 py-1 h-7 text-xs rounded-full transition-all text-slate-500 hover:text-slate-700"
                  onClick={() => {
                    clearAssetClasses();
                    setSelectedAssets([]); // Clear asset selection when clearing filters
                  }}
                >
                  <CircleX className="h-3 w-3 mr-1" /> Clear Filters
                </Button>
              )}
            </>
          )}
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
                <AssetItem
                  key={asset.asset_code}
                  asset={asset}
                  isSelected={selectedAssetCodes.includes(asset.asset_code)}
                  onToggle={toggleAsset}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <p className="text-sm italic">No assets found</p>
                {assets && assets.length > 0 ? (
                  <p className="text-xs mt-2 text-slate-300">Try changing your filters</p>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-xs mt-2 text-slate-300">Database appears to be empty or connection failed</p>
                    <p className="text-[10px] text-slate-200">API: {process.env.NEXT_PUBLIC_API_URL}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

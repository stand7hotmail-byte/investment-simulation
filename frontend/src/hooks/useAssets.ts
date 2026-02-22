import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { AssetData } from "@/types/asset";
import { useSimulationStore } from "@/store/useSimulationStore"; // New import

export function useAssets() {
  const { selectedAssetClasses } = useSimulationStore(); // Get selected asset classes

  return useQuery({
    queryKey: ["assets", selectedAssetClasses], // Include selectedAssetClasses in queryKey
    queryFn: async () => {
      const allAssets = await fetchApi<AssetData[]>("/api/assets");
      if (selectedAssetClasses.length === 0) {
        return allAssets; // No filter selected, return all assets
      }
      return allAssets.filter(
        (asset) => asset.asset_class && selectedAssetClasses.includes(asset.asset_class)
      );
    },
  });
}

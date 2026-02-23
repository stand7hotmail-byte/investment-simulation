import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api"; // Updated to use fetchApi
import { AssetClassesResponse } from "@/types/simulation";

const getAssetClasses = async (): Promise<string[]> => {
  const data = await fetchApi<AssetClassesResponse>("/api/asset-classes");
  return data.asset_classes;
};

export const useAssetClasses = () => {
  return useQuery<string[], Error>({
    queryKey: ["assetClasses"],
    queryFn: getAssetClasses,
  });
};
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AssetClassesResponse } from "@/types/simulation"; // Updated import

const getAssetClasses = async (): Promise<string[]> => {
  const response = await axios.get<AssetClassesResponse>("/api/asset-classes");
  return response.data.asset_classes;
};

export const useAssetClasses = () => {
  return useQuery<string[], Error>({
    queryKey: ["assetClasses"],
    queryFn: getAssetClasses,
  });
};
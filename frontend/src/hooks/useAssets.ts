import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { AssetData } from "@/types/asset";

export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: () => fetchApi<AssetData[]>("/api/assets"),
  });
}

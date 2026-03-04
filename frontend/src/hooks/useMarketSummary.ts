import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

export interface MarketSummaryItem {
  asset_code: string;
  name: string;
  current_price: number;
  change_percentage: number;
  sparkline: number[] | null;
}

export interface MarketSummaryResponse {
  items: MarketSummaryItem[];
}

export function useMarketSummary() {
  return useQuery<MarketSummaryResponse>({
    queryKey: ["market-summary"],
    queryFn: () => fetchApi<MarketSummaryResponse>("/api/market-summary"),
  });
}

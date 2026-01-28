import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { EfficientFrontierResponse, EfficientFrontierRequest } from "@/types/simulation";

export function useEfficientFrontier(request: EfficientFrontierRequest, enabled: boolean = false) {
  return useQuery({
    queryKey: ["efficient-frontier", request.assets],
    queryFn: () => fetchApi<EfficientFrontierResponse>("/api/simulate/efficient-frontier", {
      method: "POST",
      body: JSON.stringify(request),
    }),
    enabled: enabled && request.assets.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

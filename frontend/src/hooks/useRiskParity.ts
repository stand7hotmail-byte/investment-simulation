import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { RiskParityResponse, RiskParityRequest } from "@/types/simulation";

export function useRiskParity(request: RiskParityRequest, enabled: boolean = false) {
  return useQuery({
    queryKey: ["risk-parity", request.assets, request.bounds],
    queryFn: () => fetchApi<RiskParityResponse>("/api/simulate/risk-parity", {
      method: "POST",
      body: JSON.stringify(request),
    }),
    enabled: enabled && request.assets.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

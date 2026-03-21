import { RiskParityResponse, RiskParityRequest } from "@/types/simulation";
import { useSimulationQuery } from "./useSimulationQuery";

export function useRiskParity(request: RiskParityRequest, enabled: boolean = false) {
  return useSimulationQuery<RiskParityResponse>(
    "/api/simulate/risk-parity",
    ["risk-parity", request.assets, request.bounds],
    request,
    enabled,
    { minAssets: 2 }
  );
}

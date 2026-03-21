import { EfficientFrontierResponse, EfficientFrontierRequest } from "@/types/simulation";
import { useSimulationQuery } from "./useSimulationQuery";

export function useEfficientFrontier(request: EfficientFrontierRequest, enabled: boolean = false) {
  return useSimulationQuery<EfficientFrontierResponse>(
    "/api/simulate/efficient-frontier",
    ["efficient-frontier", request.assets],
    request,
    enabled,
    { minAssets: 2 }
  );
}

import { useMutation } from "@tanstack/react-query";
import { CustomPortfolioRequest, PortfolioPointResponse } from "@/types/simulation";
import { fetchApi } from "@/lib/api";

async function simulateCustomPortfolio(request: CustomPortfolioRequest): Promise<PortfolioPointResponse> {
  return await fetchApi<PortfolioPointResponse>("/api/simulate/custom-portfolio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
}

export function useCustomPortfolioSimulation() {
  return useMutation<PortfolioPointResponse, Error, CustomPortfolioRequest>({
    mutationFn: simulateCustomPortfolio,
  });
}

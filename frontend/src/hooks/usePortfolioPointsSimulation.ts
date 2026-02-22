import { useMutation } from "@tanstack/react-query";
import { PortfolioPointsRequest, PortfolioPointResponse } from "@/types/simulation";
import { fetchApi } from "@/lib/api";

async function simulatePortfolioPoints(request: PortfolioPointsRequest): Promise<PortfolioPointResponse[]> {
  const response = await fetchApi<PortfolioPointResponse[]>("/api/simulate/portfolio-points", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  return response;
}

export function usePortfolioPointsSimulation() {
  return useMutation<PortfolioPointResponse[], Error, PortfolioPointsRequest>({
    mutationFn: simulatePortfolioPoints,
  });
}

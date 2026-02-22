import { useMutation } from "@tanstack/react-query";
import { CustomPortfolioRequest, PortfolioPointResponse } from "@/types/simulation";

async function simulateCustomPortfolio(request: CustomPortfolioRequest): Promise<PortfolioPointResponse> {
  const response = await fetch("/api/simulate/custom-portfolio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to simulate custom portfolio");
  }

  return response.json();
}

export function useCustomPortfolioSimulation() {
  return useMutation<PortfolioPointResponse, Error, CustomPortfolioRequest>({
    mutationFn: simulateCustomPortfolio,
  });
}

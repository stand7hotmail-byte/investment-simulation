import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Portfolio, CreatePortfolioRequest } from "@/types/portfolio";

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newPortfolio: CreatePortfolioRequest) => {
      return fetchApi<Portfolio>("/api/portfolios", {
        method: "POST",
        body: JSON.stringify(newPortfolio),
      });
    },
    onSuccess: () => {
      // Invalidate the portfolios cache so that the new portfolio appears in the "My Portfolios" list
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
}

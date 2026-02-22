import { useQueries } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Portfolio } from "@/types/portfolio"; // Assuming Portfolio type includes allocations
import { useSimulationStore } from "@/store/useSimulationStore";

export function useComparisonPortfolios() {
  const { selectedComparisonPortfolioIds } = useSimulationStore();

  const results = useQueries({
    queries: selectedComparisonPortfolioIds.map((id) => ({
      queryKey: ["portfolio", id],
      queryFn: () => fetchApi<Portfolio>(`/api/portfolios/${id}`),
      enabled: !!id, // Only run query if id is not null/undefined
    })),
  });

  // Filter out loading/error queries and return only successfully fetched portfolios
  const comparisonPortfolios = results
    .filter((query) => query.isSuccess && query.data)
    .map((query) => query.data!);

  const isLoading = results.some((query) => query.isLoading);
  const isError = results.some((query) => query.isError);
  const error = results.find((query) => query.isError)?.error;

  return {
    comparisonPortfolios,
    isLoading,
    isError,
    error,
  };
}

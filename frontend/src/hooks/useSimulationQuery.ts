import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

interface SimulationQueryOptions {
  minAssets?: number;
  staleTime?: number;
}

/**
 * Base hook for all simulation POST requests.
 * Standardizes common logic like caching, enabling rules, and request format.
 */
export function useSimulationQuery<T>(
  endpoint: string,
  queryKey: any[],
  request: any,
  enabled: boolean = false,
  options: SimulationQueryOptions = {}
) {
  const { 
    minAssets = 0, 
    staleTime = 1000 * 60 * 5 // default 5 minutes
  } = options;

  const hasEnoughAssets = !request.assets || request.assets.length >= minAssets;

  return useQuery<T>({
    queryKey,
    queryFn: () => fetchApi<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(request),
    }),
    enabled: enabled && hasEnoughAssets,
    staleTime,
  });
}

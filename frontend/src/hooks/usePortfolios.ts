import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Portfolio } from "@/types/portfolio";

export function usePortfolios() {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: () => fetchApi<Portfolio[]>("/api/portfolios"),
  });
}

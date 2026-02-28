import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { SimulationResult, FrontierPoint } from "@/types/simulation";
import { useSimulationStore } from "@/store/useSimulationStore";

const getSimulationResults = async (): Promise<SimulationResult[]> => {
  return await fetchApi<SimulationResult[]>("/api/simulation-results");
};

const deleteSimulationResult = async (resultId: string): Promise<void> => {
  await fetchApi(`/api/simulation-results/${resultId}`, {
    method: "DELETE",
  });
};

export const useSimulationResults = () => {
  const queryClient = useQueryClient();
  const setSelectedPoint = useSimulationStore((state) => state.setSelectedPoint);

  const { data, isLoading, error } = useQuery<SimulationResult[], Error>({
    queryKey: ["simulationResults"],
    queryFn: getSimulationResults,
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteSimulationResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulationResults"] });
    },
  });

  const loadSimulationResult = (result: SimulationResult) => {
    let pointToSelect: FrontierPoint | null = null;
    if (result.simulation_type === "efficient_frontier") {
      if (result.results.max_sharpe) {
        pointToSelect = result.results.max_sharpe;
      } else if (result.results.risk_parity) {
        pointToSelect = result.results.risk_parity;
      } else if (result.results.frontier && result.results.frontier.length > 0) {
        pointToSelect = result.results.frontier[0];
      }
    } else if (result.simulation_type === "custom_portfolio" && result.results.custom_portfolio) {
      pointToSelect = result.results.custom_portfolio;
    }

    if (pointToSelect) {
      setSelectedPoint(pointToSelect);
    }
  };

  return {
    simulationResults: data,
    isLoading,
    error,
    deleteSimulationResult: deleteMutation.mutate,
    loadSimulationResult,
  };
};

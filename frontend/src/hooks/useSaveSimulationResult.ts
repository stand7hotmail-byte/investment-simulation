import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { SimulationResult, SimulationResultCreate } from "@/types/simulation";

const saveSimulationResult = async (data: SimulationResultCreate): Promise<SimulationResult> => {
  return await fetchApi<SimulationResult>("/api/simulation-results", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const useSaveSimulationResult = () => {
  const queryClient = useQueryClient();
  return useMutation<SimulationResult, Error, SimulationResultCreate>({
    mutationFn: saveSimulationResult,
    onSuccess: () => {
      // Invalidate relevant queries to refetch data, e.g., list of simulation results
      queryClient.invalidateQueries({ queryKey: ["simulationResults"] });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { SimulationResult, SimulationResultCreate } from "@/types/simulation";

const saveSimulationResult = async (data: SimulationResultCreate): Promise<SimulationResult> => {
  const response = await axios.post("/api/simulation-results", data);
  return response.data;
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

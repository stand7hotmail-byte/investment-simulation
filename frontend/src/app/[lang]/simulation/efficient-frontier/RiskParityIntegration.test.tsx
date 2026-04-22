import { renderHook, waitFor, act } from "@testing-library/react";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useSimulationLifecycle } from "@/hooks/useSimulationLifecycle";
import { fetchApi } from "@/lib/api";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
}));

// Mock efficient frontier to avoid unneeded API calls in this test
vi.mock("@/hooks/useEfficientFrontier", () => ({
  useEfficientFrontier: () => ({ data: { frontier: [] }, isSuccess: true, isLoading: false })
}));

describe("Risk Parity Integration", () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    useSimulationStore.getState().clearAssets();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  it("should fetch risk parity data and store it in the simulation store via lifecycle hook", async () => {
    const mockResponse = {
      expected_return: 0.06,
      volatility: 0.15,
      weights: { TOPIX: 0.5, SP500: 0.5 },
    };
    (fetchApi as any).mockResolvedValue(mockResponse);

    // 1. Set assets in store and run simulation
    act(() => {
      useSimulationStore.getState().setSelectedAssets(["TOPIX", "SP500"]);
      useSimulationStore.getState().runSimulation();
    });

    const { result } = renderHook(() => useSimulationLifecycle(), { wrapper });

    // 2. Wait for API call and store update (auto-selection logic in useSimulationLifecycle)
    await waitFor(() => {
      expect(useSimulationStore.getState().selectedPoint).toEqual(mockResponse);
    });

    expect(fetchApi).toHaveBeenCalledWith("/api/simulate/risk-parity", expect.anything());
  });
});

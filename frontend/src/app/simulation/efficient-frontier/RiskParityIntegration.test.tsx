import { renderHook, waitFor, act } from "@testing-library/react";
import { useRiskParity } from "@/hooks/useRiskParity";
import { useSimulationStore } from "@/store/useSimulationStore";
import { fetchApi } from "@/lib/api";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";

vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("Risk Parity Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    useSimulationStore.getState().clearAssets();
  });

  it("should fetch risk parity data and store it in the simulation store", async () => {
    const mockResponse = {
      expected_return: 0.06,
      volatility: 0.15,
      weights: { TOPIX: 0.5, SP500: 0.5 },
    };
    (fetchApi as any).mockResolvedValue(mockResponse);

    const TestComponent = () => {
      const selectedAssets = useSimulationStore((state) => state.selectedAssetCodes);
      const setRiskParityPoint = useSimulationStore((state) => state.setRiskParityPoint);
      const { data, isSuccess } = useRiskParity({ assets: selectedAssets }, selectedAssets.length >= 2);

      useEffect(() => {
        if (isSuccess && data) {
          setRiskParityPoint(data);
        }
      }, [isSuccess, data, setRiskParityPoint]);

      return null;
    };

    // 1. Set assets in store
    act(() => {
      useSimulationStore.getState().setSelectedAssets(["TOPIX", "SP500"]);
    });

    const { rerender } = renderHook(() => TestComponent(), { wrapper });

    // 2. Wait for API call and store update
    await waitFor(() => {
      expect(useSimulationStore.getState().riskParityPoint).toEqual(mockResponse);
    });

    expect(fetchApi).toHaveBeenCalledWith("/api/simulate/risk-parity", expect.anything());
  });
});

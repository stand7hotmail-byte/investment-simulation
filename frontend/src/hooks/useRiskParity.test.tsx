import { renderHook, waitFor } from "@testing-library/react";
import { useRiskParity } from "./useRiskParity";
import { fetchApi } from "@/lib/api";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

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

describe("useRiskParity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("calls fetchApi with correct parameters", async () => {
    const mockResponse = {
      expected_return: 0.06,
      volatility: 0.15,
      weights: { TOPIX: 0.5, SP500: 0.5 },
    };
    (fetchApi as any).mockResolvedValue(mockResponse);

    const request = { assets: ["TOPIX", "SP500"] };
    const { result } = renderHook(() => useRiskParity(request, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchApi).toHaveBeenCalledWith("/api/simulate/risk-parity", {
      method: "POST",
      body: JSON.stringify(request),
    });
    expect(result.current.data).toEqual(mockResponse);
  });

  it("does not call fetchApi when enabled is false", () => {
    const request = { assets: ["TOPIX", "SP500"] };
    renderHook(() => useRiskParity(request, false), { wrapper });

    expect(fetchApi).not.toHaveBeenCalled();
  });
});

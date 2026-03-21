import { renderHook, waitFor } from "@testing-library/react";
import { useSimulationQuery } from "./useSimulationQuery";
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

describe("useSimulationQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("calls fetchApi with correct POST parameters", async () => {
    const mockResponse = { result: "success" };
    (fetchApi as any).mockResolvedValue(mockResponse);

    const endpoint = "/api/test-sim";
    const request = { param: "value" };
    const queryKey = ["test-sim", request];
    
    const { result } = renderHook(() => 
      useSimulationQuery<typeof mockResponse>(endpoint, queryKey, request, true), 
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchApi).toHaveBeenCalledWith(endpoint, {
      method: "POST",
      body: JSON.stringify(request),
    });
    expect(result.current.data).toEqual(mockResponse);
  });

  it("disables query when assets list is insufficient", async () => {
    const request = { assets: ["only-one"] };
    const queryKey = ["test", request];
    
    renderHook(() => 
      useSimulationQuery("/api/test", queryKey, request, true, { minAssets: 2 }), 
      { wrapper }
    );

    expect(fetchApi).not.toHaveBeenCalled();
  });
});

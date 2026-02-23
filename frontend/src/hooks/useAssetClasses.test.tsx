import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAssetClasses } from "./useAssetClasses";
import { describe, it, expect, vi } from "vitest";
import { fetchApi } from "@/lib/api"; // Updated to use fetchApi
import * as React from "react";

// Mock fetchApi to control API responses
vi.mock("@/lib/api");
const mockedFetchApi = vi.mocked(fetchApi);

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useAssetClasses", () => {
  it("fetches asset classes successfully", async () => {
    const mockAssetClasses = ["Stock", "Bond", "Crypto"];
    mockedFetchApi.mockResolvedValueOnce({
      asset_classes: mockAssetClasses,
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const { result } = renderHook(() => useAssetClasses(), { wrapper: createWrapper(queryClient) });

    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAssetClasses);
    expect(result.current.error).toBeNull();
  });

  it("handles fetch error", async () => {
    const errorMessage = "Network Error";
    mockedFetchApi.mockRejectedValueOnce(new Error(errorMessage));

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const { result } = renderHook(() => useAssetClasses(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
  });
});

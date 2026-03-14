import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies that don't need dynamic changes
vi.mock("@/hooks/usePortfolios", () => ({
  usePortfolios: () => ({
    data: [{ id: "1", name: "Test Portfolio" }],
    isLoading: false
  })
}));

vi.mock("react-plotly.js", () => ({
  default: () => <div data-testid="plotly-mock" />
}));

describe("AccumulationPage Robustness", () => {
  
  beforeEach(() => {
    // Reset modules to ensure mocks are fresh for each test
    vi.resetModules();
  });

  it("should NOT crash when results.history is missing", async () => {
    // 1. Set up the dynamic mock for the API
    const mockFetchApi = vi.fn().mockResolvedValue({
      final_value: 1000000,
      // 'history' is intentionally missing
    });
    vi.doMock("@/lib/api", () => ({
      fetchApi: mockFetchApi,
    }));

    // 2. Dynamically import the component *after* the mock is established
    const { default: AccumulationPage } = await import("./page");

    render(<AccumulationPage />);

    // 3. Interact with the component
    fireEvent.change(screen.getByLabelText("Target Portfolio"), { target: { value: "1" } });
    const runButton = screen.getByText("Run Simulation");

    const safeAction = async () => {
      await act(async () => {
        fireEvent.click(runButton);
      });
    };
    
    // 4. Assert the action does NOT crash (This will fail until the code is fixed)
    await expect(safeAction()).resolves.not.toThrow();
  });
});

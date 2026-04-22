import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchApi } from "@/lib/api";

// Mock dependencies
vi.mock("@/lib/api", () => ({
  fetchApi: vi.fn(),
}));

vi.mock("@/hooks/usePortfolios", () => ({
  usePortfolios: () => ({
    data: [{ id: "1", name: "Test Portfolio" }],
    isLoading: false
  })
}));

vi.mock("react-plotly.js", () => ({
  default: () => <div data-testid="plotly-mock" />
}));

import AccumulationPage from "./page";

describe("AccumulationPage Robustness", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT crash when results.history is missing", async () => {
    // 1. Set up the dynamic mock for the API
    (fetchApi as any).mockResolvedValue({
      final_value: 1000000,
      // 'history' is intentionally missing
    });

    render(<AccumulationPage />);

    // 2. Interact with the component
    fireEvent.change(screen.getByLabelText("Target Portfolio"), { target: { value: "1" } });
    const runButton = screen.getByText("Run Simulation");

    // 3. Assert the action does NOT crash
    await act(async () => {
      fireEvent.click(runButton);
    });
    
    // If we reached here without a crash, the test passes
    // No need to check for specific text if the goal is only "no crash"
    expect(true).toBe(true);
  });
});

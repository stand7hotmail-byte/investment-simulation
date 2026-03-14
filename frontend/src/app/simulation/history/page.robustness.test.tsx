import { render, screen } from "@testing-library/react";
import SimulationHistoryPage from "./page";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseSimulationResults = vi.fn();

vi.mock("@/hooks/useSimulationResults", () => ({
  useSimulationResults: () => mockUseSimulationResults(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("SimulationHistoryPage Robustness", () => {
  beforeEach(() => {
    mockUseSimulationResults.mockClear();
  });

  it("should render fallback text for invalid dates in history table", () => {
    mockUseSimulationResults.mockReturnValue({
      simulationResults: [{ 
        id: "1", 
        simulation_type: "risk_parity", 
        created_at: "invalid-date", 
        results: { portfolios: [] } 
      }],
      isLoading: false
    });
    
    render(<SimulationHistoryPage />);
    expect(screen.getByText("Invalid Date")).toBeInTheDocument();
  });

  it("should handle empty results gracefully", () => {
    mockUseSimulationResults.mockReturnValue({
      simulationResults: [],
      isLoading: false
    });
    
    render(<SimulationHistoryPage />);
    expect(screen.getByText("No History Yet")).toBeInTheDocument();
  });
});

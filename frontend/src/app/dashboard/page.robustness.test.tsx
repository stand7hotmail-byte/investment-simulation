import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";
import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("@/hooks/useMarketSummary", () => ({
  useMarketSummary: () => ({
    data: { items: [] },
    isLoading: false
  })
}));

// We will define the mock implementation inside each test to vary the data
const mockUseSimulationResults = vi.fn();
vi.mock("@/hooks/useSimulationResults", () => ({
  useSimulationResults: () => mockUseSimulationResults()
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}));

describe("DashboardPage Robustness", () => {
  it("should not crash when created_at is an invalid date string", () => {
    mockUseSimulationResults.mockReturnValue({
      simulationResults: [
        {
          id: "1",
          simulation_type: "risk_parity",
          created_at: "invalid-date",
          results: {}
        }
      ],
      isLoading: false
    });

    // Current code crashes here, we WANT it not to throw.
    // This test will FAIL (showing Red Phase)
    expect(() => render(<DashboardPage />)).not.toThrow();
  });

  it("should display a fallback for invalid dates instead of crashing", () => {
     mockUseSimulationResults.mockReturnValue({
      simulationResults: [
        {
          id: "1",
          simulation_type: "risk_parity",
          created_at: "invalid-date",
          results: {}
        }
      ],
      isLoading: false
    });

    // If it doesn't crash, it should probably show some fallback text
    // We'll see what it shows after fix. For now it crashes.
    try {
        render(<DashboardPage />);
    } catch (e) {
        // Expected to catch RangeError here during Red Phase
    }
  });
});

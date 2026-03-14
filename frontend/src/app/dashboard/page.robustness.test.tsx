import { render, screen, act } from "@testing-library/react";
import DashboardPage from "./page";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUseSimulationResults = vi.fn();
const mockUseMarketSummary = vi.fn();

vi.mock("@/hooks/useMarketSummary", () => ({
  useMarketSummary: () => mockUseMarketSummary(),
}));

vi.mock("@/hooks/useSimulationResults", () => ({
  useSimulationResults: () => mockUseSimulationResults(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}));

describe("DashboardPage Robustness", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseSimulationResults.mockClear();
    mockUseMarketSummary.mockClear();
  });

  // Previous test for date formatting
  it("should render fallback text for invalid dates", () => {
    mockUseMarketSummary.mockReturnValue({ data: { items: [] }, isLoading: false });
    mockUseSimulationResults.mockReturnValue({
      simulationResults: [{ id: "1", simulation_type: "risk_parity", created_at: "invalid-date", results: {} }],
      isLoading: false
    });
    render(<DashboardPage />);
    expect(screen.getByText("Invalid Date")).toBeInTheDocument();
  });

  it("should render fallback div instead of NaN polyline when sparkline data has one item", () => {
    mockUseSimulationResults.mockReturnValue({ simulationResults: [], isLoading: false });
    mockUseMarketSummary.mockReturnValue({
      data: {
        items: [{
          asset_code: "SPY", name: "S&P 500", current_price: 500, change_percentage: 1.5,
          sparkline: [490] // Only one item!
        }]
      },
      isLoading: false
    });
    
    const { container } = render(<DashboardPage />);
    
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeInTheDocument();
    
    // Should have an animate-pulse div as fallback
    const fallback = container.querySelector('.animate-pulse');
    expect(fallback).toBeInTheDocument();
  });

  it("should render nothing for empty sparkline data", () => {
    mockUseSimulationResults.mockReturnValue({ simulationResults: [], isLoading: false });
    mockUseMarketSummary.mockReturnValue({
      data: {
        items: [{
          asset_code: "SPY", name: "S&P 500", current_price: 500, change_percentage: 1.5,
          sparkline: [] // Empty array
        }]
      },
      isLoading: false
    });

    const { container } = render(<DashboardPage />);
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeInTheDocument();
    
    const fallback = container.querySelector('.animate-pulse');
    expect(fallback).not.toBeInTheDocument();
  });
});

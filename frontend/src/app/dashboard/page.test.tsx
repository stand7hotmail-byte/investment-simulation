import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";
import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("@/hooks/useMarketSummary", () => ({
  useMarketSummary: () => ({
    data: { items: [
      { asset_code: "SPY", name: "S&P 500", current_price: 500, change_percentage: 1.5, sparkline: [490, 500] },
      { asset_code: "BTC", name: "Bitcoin", current_price: 60000, change_percentage: -2.0, sparkline: [61000, 60000] }
    ]},
    isLoading: false
  })
}));

vi.mock("@/hooks/useSimulationResults", () => ({
  useSimulationResults: () => ({
    data: [],
    isLoading: false
  })
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}));

describe("DashboardPage", () => {
  it("renders the dashboard title", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders market summary items", () => {
    render(<DashboardPage />);
    const spyElements = screen.getAllByText("SPY");
    expect(spyElements[0]).toBeInTheDocument();
    
    const btcElements = screen.getAllByText("BTC");
    expect(btcElements[0]).toBeInTheDocument();
    
    // Check for percentage change
    const pctElements = screen.getAllByText("1.50%");
    expect(pctElements[0]).toBeInTheDocument();
  });

  it("renders quick actions", () => {
    render(<DashboardPage />);
    const efLinks = screen.getAllByText("New Efficient Frontier");
    expect(efLinks[0]).toBeInTheDocument();
    
    const accLinks = screen.getAllByText("New Accumulation Sim");
    expect(accLinks[0]).toBeInTheDocument();
  });
});

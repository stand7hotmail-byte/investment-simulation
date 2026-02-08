import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EfficientFrontierPage from "./page";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEfficientFrontier } from "@/hooks/useEfficientFrontier";
import { useRiskParity } from "@/hooks/useRiskParity";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock hooks
vi.mock("@/hooks/useEfficientFrontier");
vi.mock("@/hooks/useRiskParity");

// Mock components
vi.mock("@/components/simulation/AssetSelector", () => ({
  AssetSelector: () => <div data-testid="asset-selector">Asset Selector</div>,
}));
vi.mock("@/components/simulation/EfficientFrontierChart", () => ({
  EfficientFrontierChart: ({ riskParity }: any) => (
    <div data-testid="ef-chart">
      Chart {riskParity ? "with Risk Parity" : "without Risk Parity"}
    </div>
  ),
}));
vi.mock("@/components/simulation/AllocationTable", () => ({
  AllocationTable: () => <div data-testid="allocation-table">Allocation Table</div>,
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("EfficientFrontierPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSimulationStore.getState().clearAssets();
  });

  it("renders initial state correctly", () => {
    (useEfficientFrontier as any).mockReturnValue({ data: null, isLoading: false });
    (useRiskParity as any).mockReturnValue({ data: null, isLoading: false });

    render(<EfficientFrontierPage />, { wrapper });

    expect(screen.getByText("Efficient Frontier Simulation")).toBeInTheDocument();
    expect(screen.getByTestId("asset-selector")).toBeInTheDocument();
    expect(screen.getByText("No results yet")).toBeInTheDocument();
  });

  it("triggers simulation and displays results including risk parity", async () => {
    const mockFrontierData = { frontier: [], max_sharpe: null };
    const mockRiskParityData = { expected_return: 0.05, volatility: 0.1, weights: { A: 1 } };

    (useEfficientFrontier as any).mockReturnValue({ data: mockFrontierData, isLoading: false });
    (useRiskParity as any).mockReturnValue({ data: mockRiskParityData, isSuccess: true });

    // Simulate asset selection
    useSimulationStore.getState().setSelectedAssets(["A", "B"]);

    render(<EfficientFrontierPage />, { wrapper });

    const runButton = screen.getByText("Run Simulation");
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByTestId("ef-chart")).toHaveTextContent("with Risk Parity");
    });

    expect(useSimulationStore.getState().selectedPoint).toEqual(mockRiskParityData);
  });
});

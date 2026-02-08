import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import EfficientFrontierPage from "./page";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEfficientFrontier } from "@/hooks/useEfficientFrontier";
import { useRiskParity } from "@/hooks/useRiskParity";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Plotlyのモックを拡張して、渡されたPropsをキャプチャできるようにします
let lastPlotProps: any = null;
vi.mock("next/dynamic", () => ({
  default: () => {
    return (props: any) => {
      lastPlotProps = props;
      return <div data-testid="mock-plotly">Plotly Chart</div>;
    };
  },
}));

vi.mock("@/hooks/useEfficientFrontier");
vi.mock("@/hooks/useRiskParity");
vi.mock("@/components/simulation/AssetSelector", () => ({ AssetSelector: () => null }));
vi.mock("@/components/simulation/AllocationTable", () => ({
  AllocationTable: () => {
    const selectedPoint = useSimulationStore((state) => state.selectedPoint);
    return (
      <div data-testid="allocation-table">
        {selectedPoint ? `Return: ${selectedPoint.expected_return}` : "No selection"}
      </div>
    );
  }
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("Detailed Click Flow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSimulationStore.getState().clearAssets();
    lastPlotProps = null;
  });

  it("should allow switching points after initial risk parity selection", async () => {
    const mockFrontierData = { 
      frontier: [
        { expected_return: 0.01, volatility: 0.05, weights: { A: 1 } },
        { expected_return: 0.02, volatility: 0.10, weights: { A: 0.5, B: 0.5 } }
      ], 
      max_sharpe: { expected_return: 0.02, volatility: 0.10, weights: { A: 0.5, B: 0.5 } }
    };
    const mockRiskParityData = { expected_return: 0.015, volatility: 0.07, weights: { A: 0.7, B: 0.3 } };

    (useEfficientFrontier as any).mockReturnValue({ data: mockFrontierData, isLoading: false });
    (useRiskParity as any).mockReturnValue({ data: mockRiskParityData, isSuccess: true });

    useSimulationStore.getState().setSelectedAssets(["A", "B"]);

    render(<EfficientFrontierPage />, { wrapper });

    // 1. シミュレーション実行
    const runButton = screen.getByText("Run Simulation");
    fireEvent.click(runButton);

    // 2. リスクパリティが自動選択されるのを待つ
    await waitFor(() => {
      expect(screen.getByTestId("allocation-table")).toHaveTextContent("Return: 0.015");
    });

    // 3. チャート上の「Max Sharpe Ratio」をクリックするシミュレーション
    act(() => {
      lastPlotProps.onClick({
        points: [{
          data: { name: "Max Sharpe Ratio" },
          pointIndex: 0
        }]
      });
    });

    // 4. テーブルが切り替わっていることを確認
    await waitFor(() => {
      expect(screen.getByTestId("allocation-table")).toHaveTextContent("Return: 0.02");
    });

    // 5. 曲線上の別の点（インデックス0）をクリック
    act(() => {
      lastPlotProps.onClick({
        points: [{
          data: { name: "Efficient Frontier" },
          pointIndex: 0
        }]
      });
    });

    // 6. 再度切り替わっていることを確認
    await waitFor(() => {
      expect(screen.getByTestId("allocation-table")).toHaveTextContent("Return: 0.01");
    });
  });
});

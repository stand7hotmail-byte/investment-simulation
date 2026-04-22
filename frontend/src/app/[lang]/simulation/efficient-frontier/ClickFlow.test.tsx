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
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    useSimulationStore.getState().clearAssets();
    lastPlotProps = null;
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
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

    // 最初はデータなし
    (useEfficientFrontier as any).mockReturnValue({ data: null, isLoading: false });
    (useRiskParity as any).mockReturnValue({ data: null, isSuccess: false });

    useSimulationStore.getState().setSelectedAssets(["A", "B"]);

    const { rerender } = render(<EfficientFrontierPage />, { wrapper });

    // 成功データをモック
    (useEfficientFrontier as any).mockReturnValue({ data: mockFrontierData, isSuccess: true, isLoading: false });
    (useRiskParity as any).mockReturnValue({ data: mockRiskParityData, isSuccess: true, isLoading: false });

    // 1. シミュレーション実行
    const runButton = screen.getAllByText("Run Simulation")[0];
    fireEvent.click(runButton);

    // rerenderして、新しい simulatedAssetCodes でフックを再実行させる
    rerender(<EfficientFrontierPage />);

    // 2. リスクパリティが自動選択されるのを待つ
    await waitFor(() => {
      expect(screen.getByTestId("allocation-table")).toHaveTextContent("Return: 0.015");
    });

    // 3. チャート上のクリックハンドラを取得して実行
    const graphDiv = { on: vi.fn(), removeAllListeners: vi.fn() };
    lastPlotProps.onInitialized({}, graphDiv);
    const clickHandler = graphDiv.on.mock.calls.find(c => c[0] === 'plotly_click')[1];

    act(() => {
      clickHandler({
        points: [{
          x: 0.10, // Max Sharpe volatility
          data: { name: "Max Sharpe Ratio" }
        }]
      });
    });

    // 4. テーブルが切り替わっていることを確認
    await waitFor(() => {
      expect(screen.getByTestId("allocation-table")).toHaveTextContent("Return: 0.02");
    });

    // 5. 曲線上の別の点をクリック
    act(() => {
      clickHandler({
        points: [{
          x: 0.05,
          data: { name: "Efficient Frontier" }
        }]
      });
    });

    // 6. 再度切り替わっていることを確認
    await waitFor(() => {
      expect(screen.getByTestId("allocation-table")).toHaveTextContent("Return: 0.01");
    });
  });
});

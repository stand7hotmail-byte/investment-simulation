import { render, screen, cleanup, act } from "@testing-library/react";
import { EfficientFrontierChart } from "./EfficientFrontierChart";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useAssets } from "@/hooks/useAssets";
import { FrontierPoint } from "@/types/simulation";
import { MockFunction } from "vitest"; // Import MockFunction

// Define globalThis for Plotly mock
declare global {
  var __MOCK_PLOT_CAPTURE__: {
    lastCallProps: any;
    plotClickCallback: Function;
  } | undefined;
}

let plotClickCallback: (event: any) => void = () => {};

interface MockSimulationStoreState {
  selectedPoint: FrontierPoint | null;
  selectedAssetCodes: string[];
  simulatedAssetCodes: string[];
  simulationId: number;
  isSimulating: boolean;
  toggleAsset: MockFunction;
  setSelectedAssets: MockFunction;
  runSimulation: MockFunction;
  setIsSimulating: MockFunction;
  setSelectedPoint: MockFunction;
  clearAssets: MockFunction;
  clearResults: MockFunction;
}

const mockSimulationStoreState: MockSimulationStoreState = {
  selectedPoint: null,
  selectedAssetCodes: [],
  simulatedAssetCodes: [],
  simulationId: 0,
  isSimulating: false,
  toggleAsset: vi.fn(),
  setSelectedAssets: vi.fn(),
  runSimulation: vi.fn(),
  setIsSimulating: vi.fn(),
  setSelectedPoint: vi.fn(),
  clearAssets: vi.fn(),
  clearResults: vi.fn(),
};

vi.mock("@/hooks/useAssets", () => ({
  useAssets: vi.fn(),
}));

vi.mock("@/store/useSimulationStore", () => {
  return {
    useSimulationStore: vi.fn(() => ({
      ...mockSimulationStoreState, // Spread current state
      setSelectedPoint: mockSimulationStoreState.setSelectedPoint,
      setSelectedAssets: mockSimulationStoreState.setSelectedAssets,
      clearAssets: mockSimulationStoreState.clearAssets,
      // Add other actions if needed
    })),
    getState: vi.fn(() => ({
      ...mockSimulationStoreState, // Spread current state
      setSelectedPoint: mockSimulationStoreState.setSelectedPoint,
      setSelectedAssets: mockSimulationStoreState.setSelectedAssets,
      clearAssets: mockSimulationStoreState.clearAssets,
      // Add other actions if needed
    })),
    setState: vi.fn((updater) => {
      // Direct update to the mutable global state
      if (typeof updater === 'function') {
        const newState = updater(mockSimulationStoreState);
        Object.assign(mockSimulationStoreState, newState);
      } else {
        Object.assign(mockSimulationStoreState, updater);
      }
    }),
  };
});


describe("EfficientFrontierChart", () => {
  const mockFrontier = [
    { volatility: 0.1, expected_return: 0.05, weights: { A: 1 } },
    { volatility: 0.15, expected_return: 0.08, weights: { B: 1 } },
  ];
  const mockMaxSharpe = { volatility: 0.12, expected_return: 0.07, weights: { A: 0.5, B: 0.5 } };
  const mockRiskParity = { volatility: 0.11, expected_return: 0.06, weights: { A: 0.6, B: 0.4 } };

  beforeEach(() => {
    // Reset our local state tracker and mock calls
    mockSimulationStoreState.selectedPoint = null;
    mockSimulationStoreState.selectedAssetCodes = [];
    mockSimulationStoreState.setSelectedPoint.mockClear();
    mockSimulationStoreState.setSelectedAssets.mockClear();
    mockSimulationStoreState.clearAssets.mockClear(); // Clear mock calls for clearAssets

    // Initialize globalThis for Plotly mock
    globalThis.__MOCK_PLOT_CAPTURE__ = {
      lastCallProps: undefined,
      plotClickCallback: vi.fn(),
    };
    plotClickCallback = globalThis.__MOCK_PLOT_CAPTURE__.plotClickCallback as (event: any) => void;
    // (mockPlot as any).lastCallProps = undefined; // This line is now redundant

    // Default mock for useAssets to prevent issues in tests not directly involving it
    (useAssets as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders without crashing", () => {
    render(<EfficientFrontierChart frontier={mockFrontier} assetsKey="test-minimal" />);
    expect(true).toBe(true); // Just ensure it renders
  });
});

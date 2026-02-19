import { render, screen } from "@testing-library/react";
import { EfficientFrontierChart } from "./EfficientFrontierChart";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSimulationStore } from "@/store/useSimulationStore";

// Mock next/dynamic
let plotClickCallback: (event: any) => void = () => {};
vi.mock("next/dynamic", () => ({
  default: () => {
    const Component = (props: any) => {
      // Capture the callback from onInitialized
      if (props.onInitialized) {
        const mockGraphDiv = {
          on: (event: string, handler: any) => {
            if (event === 'plotly_click') {
              plotClickCallback = handler;
            }
          },
          removeAllListeners: vi.fn()
        };
        props.onInitialized({}, mockGraphDiv);
      }
      return <div data-testid="mock-plotly">Plotly Chart</div>;
    };
    return Component;
  },
}));

describe("EfficientFrontierChart", () => {
  const mockFrontier = [
    { volatility: 0.1, expected_return: 0.05, weights: { A: 1 } },
    { volatility: 0.15, expected_return: 0.08, weights: { B: 1 } },
  ];
  const mockMaxSharpe = { volatility: 0.12, expected_return: 0.07, weights: { A: 0.5, B: 0.5 } };
  const mockRiskParity = { volatility: 0.11, expected_return: 0.06, weights: { A: 0.6, B: 0.4 } };

  beforeEach(() => {
    useSimulationStore.getState().clearAssets();
    plotClickCallback = () => {};
  });

  it("updates selectedPoint when clicking on Efficient Frontier", () => {
    render(<EfficientFrontierChart frontier={mockFrontier} assetsKey="test" />);
    
    // Simulate Plotly click event
    plotClickCallback({
      points: [{
        x: 0.15, // Map to volatility of the second point
        data: { name: "Efficient Frontier" }
      }]
    });

    expect(useSimulationStore.getState().selectedPoint).toEqual(mockFrontier[1]);
  });

  it("updates selectedPoint when clicking on Max Sharpe Ratio", () => {
    render(<EfficientFrontierChart frontier={mockFrontier} maxSharpe={mockMaxSharpe} assetsKey="test" />);
    
    plotClickCallback({
      points: [{
        x: 0.12,
        data: { name: "Max Sharpe Ratio" }
      }]
    });

    expect(useSimulationStore.getState().selectedPoint).toEqual(mockMaxSharpe);
  });

  it("updates selectedPoint when clicking on Risk Parity", () => {
    render(<EfficientFrontierChart frontier={mockFrontier} riskParity={mockRiskParity} assetsKey="test" />);
    
    plotClickCallback({
      points: [{
        x: 0.11,
        data: { name: "Risk Parity (ERC)" }
      }]
    });

    expect(useSimulationStore.getState().selectedPoint).toEqual(mockRiskParity);
  });
});

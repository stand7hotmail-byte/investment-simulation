import { render, screen } from "@testing-library/react";
import { EfficientFrontierChart } from "./EfficientFrontierChart";
import { describe, it, expect, vi } from "vitest";

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  default: (importFn: any) => {
    const Component = () => <div data-testid="mock-plotly">Plotly Chart</div>;
    return Component;
  },
}));

describe("EfficientFrontierChart", () => {
  const mockFrontier = [
    { volatility: 0.1, expected_return: 0.05, weights: { A: 1 } },
    { volatility: 0.15, expected_return: 0.08, weights: { B: 1 } },
  ];

  it("renders the chart title", () => {
    render(<EfficientFrontierChart frontier={mockFrontier} />);
    expect(screen.getByText("Efficient Frontier Analysis")).toBeInTheDocument();
  });

  it("renders the plotly mock", () => {
    render(<EfficientFrontierChart frontier={mockFrontier} />);
    expect(screen.getByTestId("mock-plotly")).toBeInTheDocument();
  });
});

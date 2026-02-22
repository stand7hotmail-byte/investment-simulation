import type { Meta, StoryObj } from "@storybook/react";
import { EfficientFrontierChart } from "./EfficientFrontierChart";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Import QueryClient and QueryClientProvider

const meta: Meta<typeof EfficientFrontierChart> = {
  title: "Simulation/EfficientFrontierChart",
  component: EfficientFrontierChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EfficientFrontierChart>;

const mockFrontier = [
  { volatility: 0.1, expected_return: 0.05, weights: { A: 0.6, B: 0.4 } },
  { volatility: 0.12, expected_return: 0.07, weights: { A: 0.4, B: 0.6 } },
  { volatility: 0.15, expected_return: 0.09, weights: { A: 0.2, B: 0.8 } },
];

const mockMaxSharpe = { volatility: 0.12, expected_return: 0.07, weights: { A: 0.4, B: 0.6 } };
const mockRiskParity = { volatility: 0.11, expected_return: 0.06, weights: { A: 0.5, B: 0.5 } };

const queryClient = new QueryClient(); // Create a QueryClient instance

export const Default: Story = {
  args: {
    frontier: mockFrontier,
    maxSharpe: mockMaxSharpe,
    riskParity: mockRiskParity,
    assetsKey: "A,B",
  },
  decorators: [
    (Story) => {
      useEffect(() => {
        useSimulationStore.getState().clearAssets();
      }, []);
      return (
        <QueryClientProvider client={queryClient}>
          <div className="w-[800px]"><Story /></div>
        </QueryClientProvider>
      );
    },
  ],
};

export const WithSelection: Story = {
  args: {
    frontier: mockFrontier,
    maxSharpe: mockMaxSharpe,
    riskParity: mockRiskParity,
    assetsKey: "A,B",
  },
  decorators: [
    (Story) => {
      useEffect(() => {
        useSimulationStore.getState().setSelectedPoint(mockRiskParity);
      }, []);
      return (
        <QueryClientProvider client={queryClient}>
          <div className="w-[800px]"><Story /></div>
        </QueryClientProvider>
      );
    },
  ],
};

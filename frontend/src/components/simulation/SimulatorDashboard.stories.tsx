import type { Meta, StoryObj } from "@storybook/react";
import { EfficientFrontierChart } from "./EfficientFrontierChart";
import { AllocationTable } from "./AllocationTable";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const Dashboard = () => {
  const mockFrontier = [
    { volatility: 0.1, expected_return: 0.05, weights: { TOPIX: 0.8, SP500: 0.2 } },
    { volatility: 0.12, expected_return: 0.07, weights: { TOPIX: 0.5, SP500: 0.5 } },
    { volatility: 0.15, expected_return: 0.09, weights: { TOPIX: 0.2, SP500: 0.8 } },
  ];
  const mockMaxSharpe = mockFrontier[1];
  const mockRiskParity = { volatility: 0.11, expected_return: 0.06, weights: { TOPIX: 0.6, SP500: 0.4 } };

  useEffect(() => {
    const store = useSimulationStore.getState();
    store.setSelectedPoint(mockRiskParity);
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4">Integrated Simulation Debugger</h2>
        <p className="text-sm text-slate-500 mb-6">
          Use this story to verify chart clicks and table updates in an isolated environment.
        </p>
        <EfficientFrontierChart 
          frontier={mockFrontier}
          maxSharpe={mockMaxSharpe}
          riskParity={mockRiskParity}
          assetsKey="TOPIX,SP500"
        />
        <AllocationTable 
          maxSharpePoint={mockMaxSharpe}
          riskParityPoint={mockRiskParity}
        />
      </div>
    </div>
  );
};

const meta: Meta<typeof Dashboard> = {
  title: "Simulation/IntegratedDashboard",
  component: Dashboard,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

export const Default: Story = {};

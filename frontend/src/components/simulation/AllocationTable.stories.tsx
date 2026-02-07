import type { Meta, StoryObj } from "@storybook/react";
import { AllocationTable } from "./AllocationTable";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const meta: Meta<typeof AllocationTable> = {
  title: "Simulation/AllocationTable",
  component: AllocationTable,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="w-[800px] p-4 bg-slate-50 min-h-[400px]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AllocationTable>;

const mockPoint = {
  expected_return: 0.065,
  volatility: 0.12,
  weights: {
    TOPIX: 0.4,
    SP500: 0.5,
    GOLD: 0.1,
  },
};

export const RiskParity: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        const store = useSimulationStore.getState();
        store.setRiskParityPoint(mockPoint);
        store.setSelectedPoint(mockPoint);
      }, []);
      return <Story />;
    },
  ],
};

export const MaxSharpe: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        const store = useSimulationStore.getState();
        store.setMaxSharpePoint(mockPoint);
        store.setSelectedPoint(mockPoint);
      }, []);
      return <Story />;
    },
  ],
};

export const CustomPoint: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        const store = useSimulationStore.getState();
        store.clearResults();
        store.setSelectedPoint({
          ...mockPoint,
          expected_return: 0.05,
        });
      }, []);
      return <Story />;
    },
  ],
};

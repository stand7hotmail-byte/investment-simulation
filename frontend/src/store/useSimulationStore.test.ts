import { useSimulationStore } from "./useSimulationStore";
import { describe, it, expect, beforeEach } from "vitest";

describe("useSimulationStore", () => {
  beforeEach(() => {
    useSimulationStore.getState().clearAssets();
  });

  it("should toggle draft assets", () => {
    useSimulationStore.getState().toggleAsset("A");
    expect(useSimulationStore.getState().selectedAssetCodes).toContain("A");

    useSimulationStore.getState().toggleAsset("A");
    expect(useSimulationStore.getState().selectedAssetCodes).not.toContain("A");
  });

  it("should sync draft assets to simulated assets on runSimulation", () => {
    useSimulationStore.getState().setSelectedAssets(["A", "B"]);
    expect(useSimulationStore.getState().simulatedAssetCodes).toEqual([]);
    
    useSimulationStore.getState().runSimulation();
    
    expect(useSimulationStore.getState().simulatedAssetCodes).toEqual(["A", "B"]);
    expect(useSimulationStore.getState().simulationId).toBeGreaterThan(0);
    expect(useSimulationStore.getState().isSimulating).toBe(true);
  });

  it("should set and get selectedPoint", () => {
    const mockPoint = {
      expected_return: 0.05,
      volatility: 0.1,
      weights: { A: 0.5, B: 0.5 },
    };

    useSimulationStore.getState().setSelectedPoint(mockPoint);
    expect(useSimulationStore.getState().selectedPoint).toEqual(mockPoint);
  });
});

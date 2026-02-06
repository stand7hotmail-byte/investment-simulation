import { useSimulationStore } from "./useSimulationStore";
import { describe, it, expect, beforeEach } from "vitest";

describe("useSimulationStore", () => {
  beforeEach(() => {
    useSimulationStore.getState().clearAssets();
  });

  it("should toggle assets", () => {
    useSimulationStore.getState().toggleAsset("A");
    expect(useSimulationStore.getState().selectedAssetCodes).toContain("A");

    useSimulationStore.getState().toggleAsset("A");
    expect(useSimulationStore.getState().selectedAssetCodes).not.toContain("A");
  });

  it("should set and get riskParityPoint", () => {
    const mockPoint = {
      expected_return: 0.05,
      volatility: 0.1,
      weights: { A: 0.5, B: 0.5 },
    };

    // @ts-ignore - this will fail until we add the field to the store
    useSimulationStore.getState().setRiskParityPoint(mockPoint);
    // @ts-ignore
    expect(useSimulationStore.getState().riskParityPoint).toEqual(mockPoint);
  });
});

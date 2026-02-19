import { renderHook, act } from "@testing-library/react";
import { useSimulationLifecycle } from "./useSimulationLifecycle";
import { useSimulationStore } from "@/store/useSimulationStore";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useEfficientFrontier } from "./useEfficientFrontier";
import { useRiskParity } from "./useRiskParity";

// Mock hooks and store
vi.mock("@/store/useSimulationStore");
vi.mock("./useEfficientFrontier");
vi.mock("./useRiskParity");

describe("useSimulationLifecycle", () => {
  const mockSetSelectedPoint = vi.fn();
  const mockRunSimulation = vi.fn();
  const mockSetIsSimulating = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useEfficientFrontier as any).mockReturnValue({ data: null, isLoading: false });
    (useRiskParity as any).mockReturnValue({ data: null, isLoading: false });
    (useSimulationStore as any).mockImplementation((selector: any) => 
      selector({
        selectedAssetCodes: ["A", "B"],
        simulatedAssetCodes: [],
        simulationId: 0,
        isSimulating: false,
        selectedPoint: null,
        runSimulation: mockRunSimulation,
        setIsSimulating: mockSetIsSimulating,
        setSelectedPoint: mockSetSelectedPoint,
      })
    );
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useSimulationLifecycle());
    expect(result.current.isSimulating).toBe(false);
    expect(result.current.hasResults).toBe(false);
  });

  it("should handle runSimulation and sync results", async () => {
    const { result } = renderHook(() => useSimulationLifecycle());
    
    act(() => {
      result.current.runSimulation();
    });

    expect(mockRunSimulation).toHaveBeenCalled();
  });
});

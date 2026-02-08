import { renderHook, act } from "@testing-library/react";
import { useSimulationLifecycle } from "./useSimulationLifecycle";
import { useSimulationStore } from "@/store/useSimulationStore";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock hooks and store
vi.mock("@/store/useSimulationStore");
vi.mock("./useEfficientFrontier");
vi.mock("./useRiskParity");

describe("useSimulationLifecycle", () => {
  const mockSetMaxSharpePoint = vi.fn();
  const mockSetRiskParityPoint = vi.fn();
  const mockSetSelectedPoint = vi.fn();
  const mockClearResults = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSimulationStore as any).mockImplementation((selector: any) => 
      selector({
        selectedAssetCodes: ["A", "B"],
        clearResults: mockClearResults,
        setRiskParityPoint: mockSetRiskParityPoint,
        setMaxSharpePoint: mockSetMaxSharpePoint,
        setSelectedPoint: mockSetSelectedPoint,
      })
    );
  });

  it("should initialize with default states", () => {
    // このテストはフックが存在しないため失敗する (Red Phase)
    const { result } = renderHook(() => useSimulationLifecycle());
    expect(result.current.isSimulating).toBe(false);
  });

  it("should handle runSimulation and sync results", async () => {
    const { result } = renderHook(() => useSimulationLifecycle());
    
    act(() => {
      result.current.runSimulation();
    });

    expect(result.current.isSimulating).toBe(true);
    // 実際の実装では、ここで useEfficientFrontier などの mock data が反映されることを確認する
  });
});

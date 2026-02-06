import { create } from "zustand";
import { FrontierPoint } from "@/types/simulation";

interface SimulationState {
  // State
  selectedAssetCodes: string[];
  selectedPoint: FrontierPoint | null;
  riskParityPoint: FrontierPoint | null;
  
  // Actions
  toggleAsset: (code: string) => void;
  setSelectedAssets: (codes: string[]) => void;
  clearAssets: () => void;
  setSelectedPoint: (point: FrontierPoint | null) => void;
  setRiskParityPoint: (point: FrontierPoint | null) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  selectedAssetCodes: [],
  selectedPoint: null,
  riskParityPoint: null,

  toggleAsset: (code) => set((state) => ({
    selectedAssetCodes: state.selectedAssetCodes.includes(code)
      ? state.selectedAssetCodes.filter((c) => c !== code)
      : [...state.selectedAssetCodes, code]
  })),

  setSelectedAssets: (codes) => set({ selectedAssetCodes: codes }),

  clearAssets: () => set({ selectedAssetCodes: [], selectedPoint: null, riskParityPoint: null }),

  setSelectedPoint: (point) => set({ selectedPoint: point }),

  setRiskParityPoint: (point) => set({ riskParityPoint: point }),
}));

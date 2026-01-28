import { create } from "zustand";

interface SimulationState {
  // State
  selectedAssetCodes: string[];
  
  // Actions
  toggleAsset: (code: string) => void;
  setSelectedAssets: (codes: string[]) => void;
  clearAssets: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  selectedAssetCodes: [],

  toggleAsset: (code) => set((state) => ({
    selectedAssetCodes: state.selectedAssetCodes.includes(code)
      ? state.selectedAssetCodes.filter((c) => c !== code)
      : [...state.selectedAssetCodes, code]
  })),

  setSelectedAssets: (codes) => set({ selectedAssetCodes: codes }),

  clearAssets: () => set({ selectedAssetCodes: [] }),
}));

import { create } from "zustand";
import { FrontierPoint } from "@/types/simulation";

interface SimulationState {
  // Selections
  selectedAssetCodes: string[];
  
  // Results & Simulation Status
  simulatedAssetCodes: string[];
  simulationId: number;
  selectedPoint: FrontierPoint | null;
  isSimulating: boolean;
  
  // Actions
  toggleAsset: (code: string) => void;
  setSelectedAssets: (codes: string[]) => void;
  
  runSimulation: () => void;
  setIsSimulating: (isSimulating: boolean) => void;
  setSelectedPoint: (point: FrontierPoint | null) => void;
  
  clearAssets: () => void;
  clearResults: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  selectedAssetCodes: [],
  simulatedAssetCodes: [],
  simulationId: 0,
  selectedPoint: null,
  isSimulating: false,

  toggleAsset: (code) => set((state) => ({
    selectedAssetCodes: state.selectedAssetCodes.includes(code)
      ? state.selectedAssetCodes.filter((c) => c !== code)
      : [...state.selectedAssetCodes, code]
  })),

  setSelectedAssets: (codes) => set({ selectedAssetCodes: codes }),

  runSimulation: () => set((state) => ({ 
    simulatedAssetCodes: state.selectedAssetCodes,
    simulationId: Date.now(),
    selectedPoint: null,
    isSimulating: true
  })),

  setIsSimulating: (isSimulating) => set({ isSimulating }),

  setSelectedPoint: (point) => set({ selectedPoint: point }),

  clearAssets: () => set({ 
    selectedAssetCodes: [], 
    simulatedAssetCodes: [],
    selectedPoint: null,
    isSimulating: false
  }),

  clearResults: () => set({ 
    selectedPoint: null,
    isSimulating: false
  }),
}));

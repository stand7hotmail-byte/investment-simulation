import { create } from "zustand";
import { FrontierPoint } from "@/types/simulation";

interface SimulationState {
  // Selections
  selectedAssetCodes: string[];
  selectedAssetClasses: string[]; // New: List of selected asset classes for filtering
  customAllocations: Record<string, number>; // New: asset code -> weight (0-100)
  useCustomAllocations: boolean; // New: flag to use custom allocations for simulation
  selectedComparisonPortfolioIds: string[]; // New: IDs of portfolios selected for comparison
  
  // Results & Simulation Status
  simulatedAssetCodes: string[];
  simulationId: number;
  selectedPoint: FrontierPoint | null;
  isSimulating: boolean;
  
  // Actions
  toggleAsset: (code: string) => void;
  setSelectedAssets: (codes: string[]) => void;
  toggleAssetClass: (assetClass: string) => void; // New
  clearAssetClasses: () => void; // New
  setCustomAllocation: (code: string, weight: number) => void; // New
  clearCustomAllocations: () => void; // New
  setUseCustomAllocations: (use: boolean) => void; // New
  toggleComparisonPortfolio: (portfolioId: string) => void; // New
  clearComparisonPortfolios: () => void; // New  
  runSimulation: () => void;
  setIsSimulating: (isSimulating: boolean) => void;
  setSelectedPoint: (point: FrontierPoint | null) => void;
  
  clearAssets: () => void;
  clearResults: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  selectedAssetCodes: [],
  selectedAssetClasses: [], // New: Initialize empty
  customAllocations: {}, // New: Initialize empty
  useCustomAllocations: false, // New: Initialize to false
  selectedComparisonPortfolioIds: [], // New: Initialize empty array
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

  toggleAssetClass: (assetClass) => set((state) => ({
    selectedAssetClasses: state.selectedAssetClasses.includes(assetClass)
      ? state.selectedAssetClasses.filter((ac) => ac !== assetClass)
      : [...state.selectedAssetClasses, assetClass],
  })),

  clearAssetClasses: () => set({ selectedAssetClasses: [] }),
  
  setCustomAllocation: (code, weight) => set((state) => ({
    customAllocations: {
      ...state.customAllocations,
      [code]: weight,
    },
  })),

  clearCustomAllocations: () => set({ customAllocations: {} }),

  setUseCustomAllocations: (use) => set({ useCustomAllocations: use }),

  toggleComparisonPortfolio: (portfolioId) => set((state) => ({
    selectedComparisonPortfolioIds: state.selectedComparisonPortfolioIds.includes(portfolioId)
      ? state.selectedComparisonPortfolioIds.filter((id) => id !== portfolioId)
      : [...state.selectedComparisonPortfolioIds, portfolioId],
  })),

  clearComparisonPortfolios: () => set({ selectedComparisonPortfolioIds: [] }),

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
    selectedAssetClasses: [], // Clear selected asset classes
    customAllocations: {}, // Clear custom allocations
    useCustomAllocations: false, // Reset flag
    selectedComparisonPortfolioIds: [], // Clear comparison portfolios
    simulatedAssetCodes: [],
    selectedPoint: null,
    isSimulating: false
  }),

  clearResults: () => set({ 
    selectedPoint: null,
    isSimulating: false
  }),
}));

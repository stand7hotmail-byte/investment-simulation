import { create } from 'zustand';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

interface ErrorEntry {
  timestamp: number;
}

interface CircuitStore {
  state: CircuitState;
  errors: ErrorEntry[]; // Sliding window of error timestamps
  openTime: number | null;
  probeInProgress: boolean;
  
  recordError: () => void;
  recordSuccess: () => void;
  checkCircuit: (path: string) => boolean; // returns true if call is allowed
}

const CRITICAL_PATHS = ['/api/auth/', '/api/health'];
const ERROR_THRESHOLD = 5;
const WINDOW_MS = 60000; // 60 seconds
const RECOVERY_MS = 300000; // 5 minutes

export const useCircuitStore = create<CircuitStore>((set, get) => ({
  state: 'CLOSED',
  errors: [],
  openTime: null,
  probeInProgress: false,

  recordError: () => {
    const now = Date.now();
    const { state, errors } = get();
    
    if (state === 'HALF-OPEN') {
      // Failed probe -> back to OPEN, reset recovery timer
      set({ 
        state: 'OPEN', 
        openTime: now, 
        probeInProgress: false,
        errors: [{ timestamp: now }] // Start new window with the failed probe
      });
      return;
    }

    // Filter errors to keep only those within the sliding window
    const activeErrors = [...errors, { timestamp: now }].filter(
      e => now - e.timestamp < WINDOW_MS
    );

    if (activeErrors.length >= ERROR_THRESHOLD) {
      set({ state: 'OPEN', openTime: now, errors: activeErrors, probeInProgress: false });
    } else {
      set({ errors: activeErrors });
    }
  },

  recordSuccess: () => {
    set({ state: 'CLOSED', errors: [], openTime: null, probeInProgress: false });
  },

  checkCircuit: (path: string) => {
    const { state, openTime, probeInProgress } = get();
    const now = Date.now();
    
    // R-003: Critical Paths are exempt
    if (CRITICAL_PATHS.some(cp => path.includes(cp))) return true;

    if (state === 'OPEN' && openTime) {
      // Automatic transition to HALF-OPEN after recovery period
      if (now - openTime > RECOVERY_MS && !probeInProgress) {
        set({ state: 'HALF-OPEN', probeInProgress: true });
        return true; // Allow EXACTLY ONE probe request
      }
      return false; // Block Background Paths
    }

    if (state === 'HALF-OPEN') {
      // Only the first probe that triggered HALF-OPEN is allowed to proceed
      // Subsequent checkCircuit calls (e.g. from other concurrent hooks) are blocked
      return false; 
    }

    return true;
  }
}));

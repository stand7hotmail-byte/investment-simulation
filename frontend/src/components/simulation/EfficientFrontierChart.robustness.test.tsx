import { render, screen, waitFor } from "@testing-library/react";
import { EfficientFrontierChart } from "./EfficientFrontierChart";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Define a shared variable for the callback
let capturedCallback: any = null;

// Mock Plotly at top level
vi.mock("react-plotly.js", () => ({
  default: ({ onInitialized }: any) => {
    // We use a useEffect-like approach in the mock if needed, 
    // but here we just call it.
    const mockGraphDiv = {
      on: (event: string, cb: any) => {
        if (event === 'plotly_click') {
            capturedCallback = cb;
        }
      },
      removeAllListeners: vi.fn(),
    };
    
    // Simulate Plotly's internal behavior: onInitialized is called after mounting
    // We'll use a timeout to simulate this if it's not working synchronously
    setTimeout(() => {
        if (onInitialized) onInitialized({}, mockGraphDiv);
    }, 10);

    return <div data-testid="plotly-mock" />;
  }
}));

vi.mock("@/hooks/useAssets", () => ({
  useAssets: () => ({
    data: [],
    isLoading: false
  })
}));

vi.mock("@/store/useSimulationStore", () => ({
  useSimulationStore: vi.fn((selector) => {
    const state = {
      setSelectedPoint: vi.fn(),
      selectedPoint: null,
      selectedAssetCodes: []
    };
    return selector(state);
  })
}));

describe("EfficientFrontierChart Robustness", () => {
  beforeEach(() => {
    capturedCallback = null;
    vi.clearAllMocks();
  });

  it("should not crash when handleNativeClick is called with empty candidates", async () => {
    render(
      <EfficientFrontierChart 
        frontier={[]} 
        assetsKey="test"
      />
    );

    // Wait for the callback to be captured
    await waitFor(() => expect(capturedCallback).toBeInstanceOf(Function), { timeout: 1000 });

    // Trigger click with empty candidates
    // Now it should throw the TypeError from the COMPONENT (Reduce of empty array)
    // We want to see THIS fail.
    expect(() => {
      capturedCallback({
        points: [{ x: 0.1 }]
      });
    }).not.toThrow();
  });
});

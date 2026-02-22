import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { AssetSelector } from "./AssetSelector";
import { useAssets } from "@/hooks/useAssets";
import { useAssetClasses } from "@/hooks/useAssetClasses"; // New Mock
import { useSimulationStore } from "@/store/useSimulationStore"; // New Mock
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // For useAssets, useAssetClasses

// Mock hooks
vi.mock("@/hooks/useAssets");
vi.mock("@/hooks/useAssetClasses");
vi.mock("@/store/useSimulationStore");

const queryClient = new QueryClient(); // For QueryClientProvider

// Mock functions for useSimulationStore, accessible globally within this test file
let mockToggleAssetClass: ReturnType<typeof vi.fn>;
let mockClearAssetClasses: ReturnType<typeof vi.fn>;
let mockSetSelectedAssets: ReturnType<typeof vi.fn>;

describe("AssetSelector", () => {
  const mockAssets = [
    { asset_code: "SPY", name: "S&P 500 ETF", asset_class: "Stock" },
    { asset_code: "BND", name: "Bond ETF", asset_class: "Bond" },
    { asset_code: "BTC", name: "Bitcoin", asset_class: "Crypto" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useAssets (can be overridden by specific tests)
    (useAssets as any).mockReturnValue({
      isLoading: false,
      data: mockAssets,
    });
    // Default mock for useAssetClasses
    (useAssetClasses as any).mockReturnValue({
      isLoading: false,
      data: ["Stock", "Bond", "Crypto"],
    });

    // Mock functions for useSimulationStore, reset before each test
    mockToggleAssetClass = vi.fn();
    mockClearAssetClasses = vi.fn();
    mockSetSelectedAssets = vi.fn();

    (useSimulationStore as any).mockReturnValue({
      selectedAssetCodes: [],
      selectedAssetClasses: [], // Initially no asset classes selected
      toggleAsset: vi.fn(), // Not directly tested in this component, but good to have
      toggleAssetClass: mockToggleAssetClass,
      clearAssetClasses: mockClearAssetClasses,
      setSelectedAssets: mockSetSelectedAssets,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows skeleton while loading", () => {
    (useAssets as any).mockReturnValue({
      isLoading: true,
      data: undefined,
    });

    render(<AssetSelector />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders asset list when data is available", () => {
    (useAssets as any).mockReturnValue({
      isLoading: false,
      data: mockAssets,
    });

    render(<AssetSelector />);
    expect(screen.getByText("S&P 500 ETF")).toBeInTheDocument();
    expect(screen.getByText("Bond ETF")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
  });

  it("filters assets by asset class when filter buttons are clicked", async () => {
    // Override useAssets mock for this test
    (useAssets as any).mockReturnValue({
      isLoading: false,
      data: mockAssets,
    });
    // Override useAssetClasses mock for this test
    (useAssetClasses as any).mockReturnValue({
      isLoading: false,
      data: ["Stock", "Bond", "Crypto"],
    });

    // Mock the initial state of the store
    (useSimulationStore as any).mockReturnValue({
      selectedAssetCodes: [],
      selectedAssetClasses: [], // Initially no asset classes selected
      toggleAsset: vi.fn(),
      toggleAssetClass: mockToggleAssetClass,
      clearAssetClasses: mockClearAssetClasses,
      setSelectedAssets: mockSetSelectedAssets,
    });

    const { rerender } = render( // Use rerender
      <QueryClientProvider client={queryClient}>
        <AssetSelector />
      </QueryClientProvider>
    );

    // Initial render - all asset classes available, no clear button
    expect(screen.getByRole("button", { name: "Stock" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bond" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crypto" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear Filters" })).not.toBeInTheDocument();

    // Click 'Stock' filter button
    const stockFilter = screen.getByRole("button", { name: "Stock" });
    fireEvent.click(stockFilter);
    expect(mockToggleAssetClass).toHaveBeenCalledWith("Stock");

    // Simulate store update for selectedAssetClasses to ["Stock"]
    // And re-render
    (useSimulationStore as any).mockReturnValue({
      selectedAssetCodes: [],
      selectedAssetClasses: ["Stock"],
      toggleAsset: vi.fn(),
      toggleAssetClass: mockToggleAssetClass,
      clearAssetClasses: mockClearAssetClasses,
      setSelectedAssets: mockSetSelectedAssets,
    });
    rerender( // Use rerender
      <QueryClientProvider client={queryClient}>
        <AssetSelector />
      </QueryClientProvider>
    );

    // useAssets should now return only Stock assets (simulated by mocking its return)
    (useAssets as any).mockReturnValue({
      isLoading: false,
      data: [mockAssets[0]], // Only Stock asset
    });
    await waitFor(() => {
      expect(screen.getByText("S&P 500 ETF")).toBeInTheDocument();
      expect(screen.queryByText("Bond ETF")).not.toBeInTheDocument();
      expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Clear Filters" })).toBeInTheDocument();
    });

    // Click 'Bond' filter button
    const bondFilter = screen.getByRole("button", { name: "Bond" });
    fireEvent.click(bondFilter);
    expect(mockToggleAssetClass).toHaveBeenCalledWith("Bond");

    // useAssets should now return Stock and Bond assets
    (useAssets as any).mockReturnValue({
      isLoading: false,
      data: [mockAssets[0], mockAssets[1]], // Stock and Bond assets
    });

    // Simulate store update for selectedAssetClasses to ["Stock", "Bond"]
    // And re-render
    (useSimulationStore as any).mockReturnValue({
      selectedAssetCodes: [],
      selectedAssetClasses: ["Stock", "Bond"],
      toggleAsset: vi.fn(),
      toggleAssetClass: mockToggleAssetClass,
      clearAssetClasses: mockClearAssetClasses,
      setSelectedAssets: mockSetSelectedAssets,
    });
    rerender( // Use rerender
      <QueryClientProvider client={queryClient}>
        <AssetSelector />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("S&P 500 ETF")).toBeInTheDocument();
      expect(screen.getByText("Bond ETF")).toBeInTheDocument();
      expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();
    });

    // Click 'Clear Filters' button
    const clearFiltersButton = screen.getByRole("button", { name: "Clear Filters" });
    fireEvent.click(clearFiltersButton);
    expect(mockClearAssetClasses).toHaveBeenCalled();
    expect(mockSetSelectedAssets).toHaveBeenCalledWith([]); // Should also clear selected assets

    // useAssets should now return all assets again
    (useAssets as any).mockReturnValue({
      isLoading: false,
      data: mockAssets,
    });

    // Simulate store update for selectedAssetClasses to []
    // And re-render
    (useSimulationStore as any).mockReturnValue({
      selectedAssetCodes: [],
      selectedAssetClasses: [],
      toggleAsset: vi.fn(),
      toggleAssetClass: mockToggleAssetClass,
      clearAssetClasses: mockClearAssetClasses,
      setSelectedAssets: mockSetSelectedAssets,
    });
    rerender( // Use rerender
      <QueryClientProvider client={queryClient}>
        <AssetSelector />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("S&P 500 ETF")).toBeInTheDocument();
      expect(screen.getByText("Bond ETF")).toBeInTheDocument();
      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Clear Filters" })).not.toBeInTheDocument(); // Clear button should be gone
    });
  });
});

import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AssetSelector } from "./AssetSelector";
import { useAssets } from "@/hooks/useAssets";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock hooks
vi.mock("@/hooks/useAssets");

describe("AssetSelector", () => {
  const mockAssets = [
    { asset_code: "SPY", name: "S&P 500 ETF", asset_class: "Stock" },
    { asset_code: "BND", name: "Bond ETF", asset_class: "Bond" },
    { asset_code: "BTC", name: "Bitcoin", asset_class: "Crypto" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
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

  it("filters assets by asset class when a filter button is clicked", () => {
    (useAssets as any).mockReturnValue({
      isLoading: false,
      data: mockAssets,
    });

    render(<AssetSelector />);

    // Initially all assets are shown
    expect(screen.getByText("S&P 500 ETF")).toBeInTheDocument();
    expect(screen.getByText("Bond ETF")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();

    // Click 'Bond' filter button
    const bondFilter = screen.getByRole("button", { name: /^Bond$/i });
    fireEvent.click(bondFilter);

    // Only Bond ETF should be shown
    expect(screen.queryByText("S&P 500 ETF")).not.toBeInTheDocument();
    expect(screen.getByText("Bond ETF")).toBeInTheDocument();
    expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();

    // Click 'All' filter button
    const allFilter = screen.getByRole("button", { name: /All/i });
    fireEvent.click(allFilter);

    // All assets should be shown again
    expect(screen.getByText("S&P 500 ETF")).toBeInTheDocument();
    expect(screen.getByText("Bond ETF")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { AssetSelector } from "./AssetSelector";
import { useAssets } from "@/hooks/useAssets";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock hooks
vi.mock("@/hooks/useAssets");

describe("AssetSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton while loading", () => {
    (useAssets as any).mockReturnValue({
      isLoading: true,
      data: undefined,
    });

    render(<AssetSelector />);
    // Check for skeletons (assuming they have specific class or role)
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders asset list when data is available", () => {
    const mockAssets = [
      { asset_code: "TOPIX", name: "TOPIX (Japan)" },
      { asset_code: "SP500", name: "S&P 500 (US)" },
    ];

    (useAssets as any).mockReturnValue({
      isLoading: false,
      data: mockAssets,
    });

    render(<AssetSelector />);
    expect(screen.getByText("TOPIX (Japan)")).toBeInTheDocument();
    expect(screen.getByText("S&P 500 (US)")).toBeInTheDocument();
  });
});

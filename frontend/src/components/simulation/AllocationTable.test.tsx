import { render, screen } from "@testing-library/react";
import { AllocationTable } from "./AllocationTable";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useAssets } from "@/hooks/useAssets";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/store/useSimulationStore");
vi.mock("@/hooks/useAssets");

describe("AllocationTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no point is selected", () => {
    (useSimulationStore as any).mockImplementation((selector) => selector({
      selectedPoint: null,
      setSelectedPoint: vi.fn(),
      selectedComparisonPortfolioIds: [],
    }));
    (useAssets as any).mockReturnValue({ data: [] });
    const { container } = render(<AllocationTable comparisonPortfolioPoints={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders allocation details when a point is selected", () => {
    const mockPoint = {
      expected_return: 0.05,
      volatility: 0.1,
      weights: { TOPIX: 0.6, SP500: 0.4 },
    };
    const mockAssets = [
      { asset_code: "TOPIX", name: "TOPIX" },
      { asset_code: "SP500", name: "S&P 500" },
    ];

    (useSimulationStore as any).mockImplementation((selector) => selector({
      selectedPoint: mockPoint,
      setSelectedPoint: vi.fn(),
      selectedComparisonPortfolioIds: [],
    }));
    (useAssets as any).mockReturnValue({ data: mockAssets });

    render(<AllocationTable comparisonPortfolioPoints={[]} riskParityPoint={mockPoint} maxSharpePoint={mockPoint} />);
    
    expect(screen.getByText("Asset Allocation Details")).toBeInTheDocument();
    expect(screen.getByText("TOPIX")).toBeInTheDocument();
    expect(screen.getByText("S&P 500")).toBeInTheDocument();
    expect(screen.getByText("60.00%")).toBeInTheDocument();
    expect(screen.getByText("40.00%")).toBeInTheDocument();
  });
});

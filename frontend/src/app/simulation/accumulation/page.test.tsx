import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccumulationPage from "./page";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { usePortfolios } from "@/hooks/usePortfolios";
import { fetchApi } from "@/lib/api";

// Mock the hooks and API
vi.mock("@/hooks/usePortfolios");
vi.mock("@/lib/api");
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Plotly to avoid errors in JSDOM
vi.mock("react-plotly.js", () => ({
  default: () => <div data-testid="plotly-mock">Plotly Chart</div>
}));

describe("AccumulationPage", () => {
  const mockPortfolios = [
    { id: "1", name: "Portfolio 1", description: "Test Portfolio 1" },
    { id: "2", name: "Portfolio 2", description: "Test Portfolio 2" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (usePortfolios as any).mockReturnValue({
      data: mockPortfolios,
      isLoading: false,
    });
  });

  it("renders the simulation input form", () => {
    render(<AccumulationPage />);
    
    expect(screen.getByText("Accumulation Sim")).toBeDefined();
    expect(screen.getByLabelText(/Initial Investment/i)).toBeDefined();
    expect(screen.getByLabelText(/Monthly Contribution/i)).toBeDefined();
    expect(screen.getByLabelText(/Period/i)).toBeDefined();
    expect(screen.getByLabelText(/Target Portfolio/i)).toBeDefined();
  });

  it("submits the form and displays results", async () => {
    const mockResponse = {
      final_value: 3138241.72,
      history: [
        { year: 0, value: 1000000 },
        { year: 1, value: 1170000 },
        { year: 10, value: 3138241.72 },
      ],
    };

    (fetchApi as any).mockResolvedValue(mockResponse);

    render(<AccumulationPage />);

    // Fill the form
    fireEvent.change(screen.getByLabelText(/Initial Investment/i), { target: { value: "1000000" } });
    fireEvent.change(screen.getByLabelText(/Monthly Contribution/i), { target: { value: "10000" } });
    fireEvent.change(screen.getByLabelText(/Period/i), { target: { value: "10" } });
    
    // Select portfolio
    fireEvent.change(screen.getByLabelText(/Target Portfolio/i), { target: { value: "1" } });

    // Submit - Use queryAll and take the first one to be safe, though there should only be one
    const submitBtns = screen.queryAllByRole("button", { name: /Run Simulation/i });
    fireEvent.click(submitBtns[0]);

    await waitFor(() => {
      expect(fetchApi).toHaveBeenCalledWith("/api/simulate/basic-accumulation", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          portfolio_id: "1",
          initial_investment: 1000000,
          monthly_contribution: 10000,
          years: 10,
        }),
      }));
    });

    expect(screen.getByText(/¥3,138,242/)).toBeDefined();
  });
});

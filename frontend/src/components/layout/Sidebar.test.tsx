import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { describe, it, expect, afterEach, vi } from "vitest";

// Mock useRouter and usePathname
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Sidebar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the application name", () => {
    render(<Sidebar />);
    expect(screen.getByText("InvestSim")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Efficient Frontier" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Portfolios" })).toBeInTheDocument();
  });

  it("has a white background (light theme)", () => {
    const { container } = render(<Sidebar />);
    const sidebarDiv = container.firstChild;
    expect(sidebarDiv).toHaveClass("bg-white");
  });

  it("toggles collapse state when the button is clicked", () => {
    render(<Sidebar />);
    
    // Initially expanded
    expect(screen.getByText("InvestSim")).toBeInTheDocument();
    
    // Find toggle button (it has ChevronLeft icon initially)
    const toggleButton = screen.getByRole("button", { name: "" }); // icon button might not have a name unless added
    // Let's use a more specific selector if possible, or just click the first button
    fireEvent.click(toggleButton);
    
    // Now collapsed, should show "IS" instead of "InvestSim"
    expect(screen.getByText("IS")).toBeInTheDocument();
    expect(screen.queryByText("InvestSim")).not.toBeInTheDocument();
  });
});

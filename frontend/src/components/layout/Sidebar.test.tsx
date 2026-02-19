import { render, screen, cleanup } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { describe, it, expect, afterEach } from "vitest";

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
});

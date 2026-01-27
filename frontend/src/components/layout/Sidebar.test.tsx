import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { describe, it, expect } from "vitest";

describe("Sidebar", () => {
  it("renders the application name", () => {
    render(<Sidebar />);
    expect(screen.getByText("InvestSim")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Efficient Frontier")).toBeInTheDocument();
    expect(screen.getByText("Portfolios")).toBeInTheDocument();
  });
});

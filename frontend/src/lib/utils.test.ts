import { describe, it, expect } from "vitest";
import { formatSafeDate } from "./utils";

describe("formatSafeDate", () => {
  it("should format valid dates correctly", () => {
    const date = "2024-01-01T00:00:00Z";
    expect(formatSafeDate(date, "yyyy-MM-dd")).toBe("2024-01-01");
  });

  it("should return fallback text for invalid date strings", () => {
    expect(formatSafeDate("not-a-date")).toBe("Invalid Date");
    expect(formatSafeDate(null as any)).toBe("Invalid Date");
    expect(formatSafeDate(undefined as any)).toBe("Invalid Date");
  });

  it("should use custom fallback text when provided", () => {
    expect(formatSafeDate("not-a-date", "yyyy-MM-dd", "No Date")).toBe("No Date");
  });
});

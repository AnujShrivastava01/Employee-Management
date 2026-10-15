import { describe, expect, it } from "vitest";
import { formatDate, formatRelativeDate, formatSalary, initials, parseIsoDate, todayIso } from "./format";

describe("format", () => {
  it("formats salaries as Indian rupees with lakh grouping", () => {
    expect(formatSalary(1850000)).toBe("₹18,50,000");
    expect(formatSalary(1234567.5)).toBe("₹12,34,567.5");
    expect(formatSalary(0)).toBe("₹0");
  });

  it("formats ISO dates without timezone drift", () => {
    expect(formatDate("2023-06-12")).toBe("12 Jun 2023");
    expect(formatDate("2024-01-01")).toBe("01 Jan 2024");
    expect(formatDate("2022-09-26")).toBe("26 Sep 2022");
    expect(parseIsoDate("2024-12-31").getDate()).toBe(31);
  });

  it("builds today's ISO date in local time", () => {
    expect(todayIso(new Date(2026, 9, 5))).toBe("2026-10-05");
  });

  it("describes relative dates", () => {
    const now = new Date(2026, 9, 15);
    expect(formatRelativeDate("2026-10-15", now)).toBe("today");
    expect(formatRelativeDate("2026-10-14", now)).toBe("yesterday");
    expect(formatRelativeDate("2026-10-05", now)).toBe("10 days ago");
    expect(formatRelativeDate("2026-07-15", now)).toBe("3 months ago");
    expect(formatRelativeDate("2024-10-14", now)).toBe("2 years ago");
    expect(formatRelativeDate("2026-10-20", now)).toBe("in 5 days");
  });

  it("derives avatar initials", () => {
    expect(initials("Ananya Iyer")).toBe("AI");
    expect(initials("  priya   nair  ")).toBe("PN");
    expect(initials("Madonna")).toBe("M");
    expect(initials("Ravi Kumar Singh")).toBe("RS");
    expect(initials("")).toBe("?");
  });
});

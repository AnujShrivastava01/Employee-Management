import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createFakeApi, makeDepartment, makeEmployee, manyEmployees } from "@/test/fake-api";
import { renderWithProviders } from "@/test/render";
import { Dashboard } from "./dashboard";
import { monthLabel } from "./hiring-trend-chart";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
// Recharts needs real layout (ResizeObserver sizes); the chart's data contract is verified through its props instead.
vi.mock("./department-chart", () => ({
  DepartmentChart: ({ data }: { data: { department: string; count: number }[] }) => (
    <ul aria-label="chart">{data.map((d) => <li key={d.department}>{`${d.department}=${d.count}`}</li>)}</ul>
  ),
}));

describe("<Dashboard>", () => {
  it("shows backend statistics, department distribution and recent joiners", async () => {
    createFakeApi({
      employees: [
        ...manyEmployees(6),
        makeEmployee(50, { fullName: "Newest Joiner", dateOfJoining: new Date().toISOString().slice(0, 10), designation: "Analyst" }),
      ],
      departments: [makeDepartment(1, "Engineering"), makeDepartment(2, "Design"), makeDepartment(3, "Legal")],
    }).install();

    renderWithProviders(<Dashboard />);

    expect(await screen.findByTestId("stat-total-employees")).toHaveTextContent("7");
    expect(screen.getByTestId("stat-active-employees")).toHaveTextContent("5");
    expect(screen.getByTestId("stat-inactive-employees")).toHaveTextContent("2");
    expect(screen.getByTestId("stat-departments")).toHaveTextContent("3");
    expect(screen.getByText("71% of workforce")).toBeInTheDocument();

    const chart = screen.getByRole("list", { name: "chart" });
    expect(within(chart).getByText("Engineering=5")).toBeInTheDocument();
    expect(within(chart).getByText("Design=2")).toBeInTheDocument();
    expect(within(chart).queryByText(/Legal/)).not.toBeInTheDocument(); // empty departments are omitted

    const recent = screen.getByRole("link", { name: /Newest Joiner/ });
    expect(recent).toHaveAttribute("href", "/employees/50");
    expect(within(recent).getByText("today")).toBeInTheDocument();
  });

  it("greets the signed-in user and summarises the organisation in the hero", async () => {
    createFakeApi({ employees: manyEmployees(6) }).install();
    renderWithProviders(<Dashboard />);

    expect(await screen.findByRole("heading", { level: 1, name: /Good (morning|afternoon|evening), admin/i })).toBeInTheDocument();
    expect(await screen.findByText(/6 people across 2 departments · 4 active today/)).toBeInTheDocument();
  });

  it("renders the workforce status donut and the 12-month hiring trend from backend data", async () => {
    createFakeApi({ employees: manyEmployees(6) }).install();
    renderWithProviders(<Dashboard />);

    expect(await screen.findByRole("img", { name: "4 active and 2 inactive employees" })).toBeInTheDocument();
    const trend = screen.getByRole("img", { name: /Employees hired per month, last 12 months/ });
    expect(trend).toHaveAccessibleName(/Oct ’26: 0/);
    expect(trend).toHaveAccessibleName(/Dec ’26: 6/);
  });

  it("offers quick actions", async () => {
    createFakeApi({ employees: manyEmployees(2) }).install();
    renderWithProviders(<Dashboard />);

    expect(screen.getByRole("link", { name: /Add employee/ })).toHaveAttribute("href", "/employees/new");
    expect(screen.getByRole("link", { name: /View employees/ })).toHaveAttribute("href", "/employees");
    await screen.findByTestId("stat-total-employees");
  });

  it("shows skeletons while loading", () => {
    createFakeApi({ employees: manyEmployees(2) }).install();
    renderWithProviders(<Dashboard />);
    expect(screen.getByRole("status", { name: "Loading chart" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading recent joiners" })).toBeInTheDocument();
  });

  it("handles an empty organisation gracefully", async () => {
    createFakeApi({ employees: [], departments: [] }).install();
    renderWithProviders(<Dashboard />);

    expect(await screen.findByText("No department data yet")).toBeInTheDocument();
    expect(screen.getByTestId("stat-total-employees")).toHaveTextContent("0");
    expect(screen.getByText("Nobody has joined yet.")).toBeInTheDocument();
  });

  it("shows an error state and retries", async () => {
    const api = createFakeApi({ employees: manyEmployees(2) });
    api.install();
    api.failNext("GET", /stats/, 500, { status: 500, code: "INTERNAL_ERROR", message: "The server ran into a problem." });
    const { user } = renderWithProviders(<Dashboard />);

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load the dashboard");
    await user.click(screen.getByRole("button", { name: /Try again/ }));
    expect(await screen.findByTestId("stat-total-employees")).toHaveTextContent("2");
  });
});

describe("monthLabel", () => {
  it("formats yyyy-MM as a short month and two-digit year", () => {
    expect(monthLabel("2026-01")).toBe("Jan ’26");
    expect(monthLabel("2025-12")).toBe("Dec ’25");
  });
});

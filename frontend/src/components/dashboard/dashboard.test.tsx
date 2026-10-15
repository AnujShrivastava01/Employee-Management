import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createFakeApi, makeDepartment, makeEmployee, manyEmployees } from "@/test/fake-api";
import { renderWithProviders } from "@/test/render";
import { Dashboard } from "./dashboard";

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

import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeApi, makeEmployee } from "@/test/fake-api";
import { currentUrl, setUrl } from "@/test/navigation-mock";
import { renderWithProviders } from "@/test/render";
import { EmployeeDetails } from "./employee-details";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const employee = makeEmployee(7, {
  employeeId: "EMP-1007",
  fullName: "Ananya Iyer",
  email: "ananya.iyer@example.com",
  phone: "+91 98765 43210",
  department: { id: 1, name: "Engineering" },
  designation: "Senior Software Engineer",
  dateOfJoining: "2023-06-12",
  salary: 1850000,
  status: "ACTIVE",
});

describe("<EmployeeDetails>", () => {
  beforeEach(() => setUrl("/employees/7"));

  it("shows every employee field and navigation actions", async () => {
    createFakeApi({ employees: [employee] }).install();
    renderWithProviders(<EmployeeDetails id="7" />);

    expect(await screen.findByRole("heading", { level: 1, name: /Ananya Iyer/ })).toBeInTheDocument();
    expect(screen.getAllByText("EMP-1007").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "ananya.iyer@example.com" })).toHaveAttribute("href", "mailto:ananya.iyer@example.com");
    expect(screen.getByRole("link", { name: "+91 98765 43210" })).toHaveAttribute("href", "tel:+919876543210");
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Senior Software Engineer")).toBeInTheDocument();
    expect(screen.getByText(/12 Jun 2023/)).toBeInTheDocument();
    expect(screen.getByText("₹18,50,000")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Edit/ })).toHaveAttribute("href", "/employees/7/edit");
    expect(screen.getByRole("link", { name: /Back to list/ })).toHaveAttribute("href", "/employees");
  });

  it("requires confirmation before deleting and returns to the list afterwards", async () => {
    const api = createFakeApi({ employees: [employee] });
    api.install();
    const { user } = renderWithProviders(<EmployeeDetails id="7" />);
    await screen.findByRole("heading", { level: 1, name: /Ananya Iyer/ });

    await user.click(screen.getByRole("button", { name: /Delete/ }));
    const dialog = await screen.findByRole("alertdialog");
    expect(api.calls("DELETE", /employees/)).toHaveLength(0);
    await user.click(within(dialog).getByRole("button", { name: "Delete employee" }));

    await waitFor(() => expect(api.calls("DELETE", /^\/api\/employees\/7$/)).toHaveLength(1));
    await waitFor(() => expect(currentUrl()).toBe("/employees"));
    expect(api.state.employees).toHaveLength(0);
  });

  it("shows a not-found state with a way back", async () => {
    createFakeApi({ employees: [] }).install();
    renderWithProviders(<EmployeeDetails id="999" />);

    expect(await screen.findByText("Employee not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to employees/ })).toHaveAttribute("href", "/employees");
  });

  it("offers a retry when the server fails", async () => {
    const api = createFakeApi({ employees: [employee] });
    api.install();
    api.failNext("GET", /employees\/7/, 500, { status: 500, code: "INTERNAL_ERROR", message: "The server ran into a problem." });
    const { user } = renderWithProviders(<EmployeeDetails id="7" />);

    expect(await screen.findByText("We couldn't load this employee")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Try again/ }));
    expect(await screen.findByRole("heading", { level: 1, name: /Ananya Iyer/ })).toBeInTheDocument();
  });
});

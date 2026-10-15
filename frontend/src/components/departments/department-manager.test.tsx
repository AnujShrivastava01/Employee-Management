import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createFakeApi, makeDepartment, makeEmployee } from "@/test/fake-api";
import { renderWithProviders } from "@/test/render";
import { DepartmentManager } from "./department-manager";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

describe("<DepartmentManager>", () => {
  it("lists departments with headcount", async () => {
    createFakeApi({ employees: [makeEmployee(1), makeEmployee(2)] }).install();
    renderWithProviders(<DepartmentManager />);

    const table = await screen.findByRole("table", { name: "Departments" });
    expect(within(table).getByText("Engineering")).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "2" })).toHaveAttribute("href", "/employees?department=Engineering");
  });

  it("creates a department", async () => {
    const api = createFakeApi();
    api.install();
    const { user } = renderWithProviders(<DepartmentManager />);
    await screen.findByRole("table", { name: "Departments" });

    await user.click(screen.getByRole("button", { name: /New department/ }));
    await user.type(await screen.findByLabelText(/^Name/), "Legal");
    await user.click(screen.getByRole("button", { name: "Create department" }));

    await waitFor(() => expect(api.calls("POST", /departments/)).toHaveLength(1));
    expect(api.calls("POST", /departments/)[0]!.body).toMatchObject({ name: "Legal" });
    expect(await screen.findByText("Legal")).toBeInTheDocument();
  });

  it("requires a name and reports duplicates on the field", async () => {
    createFakeApi().install();
    const { user } = renderWithProviders(<DepartmentManager />);
    await screen.findByRole("table", { name: "Departments" });

    await user.click(screen.getByRole("button", { name: /New department/ }));
    await user.click(await screen.findByRole("button", { name: "Create department" }));
    expect(await screen.findByText("Department name is required")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Name/), "engineering");
    await user.click(screen.getByRole("button", { name: "Create department" }));
    expect(await screen.findByText("A department named 'engineering' already exists")).toBeInTheDocument();
  });

  it("explains why a department with employees cannot be deleted", async () => {
    const api = createFakeApi({ employees: [makeEmployee(1)] });
    api.install();
    const { user } = renderWithProviders(<DepartmentManager />);
    await screen.findByRole("table", { name: "Departments" });

    await user.click(screen.getByRole("button", { name: "Delete Engineering" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/still has 1 employee/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete department" })).not.toBeInTheDocument();
    expect(api.calls("DELETE", /departments/)).toHaveLength(0);
  });

  it("deletes an empty department after confirmation", async () => {
    const api = createFakeApi({ departments: [makeDepartment(1, "Engineering"), makeDepartment(5, "Legal")] });
    api.install();
    const { user } = renderWithProviders(<DepartmentManager />);
    await screen.findByRole("table", { name: "Departments" });

    await user.click(screen.getByRole("button", { name: "Delete Legal" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete department" }));

    await waitFor(() => expect(screen.queryByText("Legal")).not.toBeInTheDocument());
    expect(api.calls("DELETE", /departments\/5/)).toHaveLength(1);
  });

  it("shows an empty state when there are no departments", async () => {
    createFakeApi({ departments: [] }).install();
    renderWithProviders(<DepartmentManager />);
    expect(await screen.findByText("No departments yet")).toBeInTheDocument();
  });
});

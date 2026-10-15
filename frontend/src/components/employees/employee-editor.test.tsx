import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeApi, makeEmployee } from "@/test/fake-api";
import { currentUrl, navigationLog, setUrl } from "@/test/navigation-mock";
import { renderWithProviders } from "@/test/render";
import { CreateEmployee, EditEmployee } from "./employee-editor";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

async function fillValidForm(user: ReturnType<typeof renderWithProviders>["user"], overrides: Record<string, string> = {}) {
  const values = {
    "Employee ID": "emp-3001",
    "Full name": "Ananya Iyer",
    "Email address": "Ananya.Iyer@Example.com",
    "Phone number": "+91 98765 43210",
    Designation: "Senior Software Engineer",
    "Annual salary (₹)": "1850000.50",
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    const field = await screen.findByLabelText(new RegExp(`^${label.replace(/[()₹]/g, "\\$&")}`));
    await user.clear(field);
    await user.type(field, value);
  }
  await user.selectOptions(screen.getByLabelText(/^Department/), "Design");
  await user.type(screen.getByLabelText(/^Date of joining/), "2023-06-12");
}

describe("<CreateEmployee>", () => {
  beforeEach(() => {
    setUrl("/employees/new");
    toast.success.mockClear();
  });

  it("loads department options from the backend", async () => {
    createFakeApi().install();
    renderWithProviders(<CreateEmployee />);

    const select = await screen.findByLabelText(/^Department/);
    await waitFor(() => expect(within(select).getByRole("option", { name: "Engineering" })).toBeInTheDocument());
    expect(within(select).getByRole("option", { name: "Design" })).toBeInTheDocument();
  });

  it("shows a validation message next to every empty required field and does not submit", async () => {
    const api = createFakeApi();
    api.install();
    const { user } = renderWithProviders(<CreateEmployee />);
    await screen.findByLabelText(/^Employee ID/);

    await user.click(screen.getByRole("button", { name: "Create employee" }));

    expect(await screen.findByText("Employee ID is required")).toBeInTheDocument();
    expect(screen.getByText("Full name is required")).toBeInTheDocument();
    expect(screen.getByText("Email address is required")).toBeInTheDocument();
    expect(screen.getByText("Phone number is required")).toBeInTheDocument();
    expect(screen.getByText("Department is required")).toBeInTheDocument();
    expect(screen.getByText("Designation is required")).toBeInTheDocument();
    expect(screen.getByText("Date of joining is required")).toBeInTheDocument();
    expect(screen.getByText("Salary is required")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Employee ID/)).toHaveAttribute("aria-invalid", "true");
    expect(api.calls("POST", /employees/)).toHaveLength(0);
  });

  it("validates email, phone and salary formats", async () => {
    createFakeApi().install();
    const { user } = renderWithProviders(<CreateEmployee />);
    await fillValidForm(user, { "Email address": "not-an-email", "Phone number": "12", "Annual salary (₹)": "-50" });

    await user.click(screen.getByRole("button", { name: "Create employee" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText(/Enter a valid phone number/)).toBeInTheDocument();
    expect(screen.getByText("Salary cannot be negative")).toBeInTheDocument();
  });

  it("creates the employee, sends a correctly typed payload and navigates to the new record", async () => {
    const api = createFakeApi();
    api.install();
    const { user } = renderWithProviders(<CreateEmployee />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Create employee" }));

    await waitFor(() => expect(api.calls("POST", /^\/api\/employees$/)).toHaveLength(1));
    expect(api.calls("POST", /^\/api\/employees$/)[0]!.body).toEqual({
      employeeId: "emp-3001",
      fullName: "Ananya Iyer",
      email: "Ananya.Iyer@Example.com",
      phone: "+91 98765 43210",
      departmentId: 2,
      designation: "Senior Software Engineer",
      dateOfJoining: "2023-06-12",
      salary: 1850000.5,
      status: "ACTIVE",
    });
    await waitFor(() => expect(currentUrl()).toMatch(/^\/employees\/\d+$/));
    expect(toast.success).toHaveBeenCalledWith("Ananya Iyer was added");
  });

  it("prevents duplicate submissions while the request is in flight", async () => {
    const api = createFakeApi();
    api.install();
    const release = api.holdNext("POST", /^\/api\/employees$/);
    const { user } = renderWithProviders(<CreateEmployee />);
    await fillValidForm(user);

    await user.dblClick(screen.getByRole("button", { name: "Create employee" }));

    const busy = await screen.findByRole("button", { name: "Saving…" });
    expect(busy).toBeDisabled();
    await user.click(busy);
    expect(api.calls("POST", /^\/api\/employees$/)).toHaveLength(1);

    release();
    await waitFor(() => expect(currentUrl()).toMatch(/^\/employees\/\d+$/));
    expect(api.calls("POST", /^\/api\/employees$/)).toHaveLength(1);
  });

  it("does not post twice when a fast server answers between two rapid clicks", async () => {
    const api = createFakeApi();
    api.install();
    const { user } = renderWithProviders(<CreateEmployee />);
    await fillValidForm(user);

    await user.dblClick(screen.getByRole("button", { name: "Create employee" }));

    await waitFor(() => expect(currentUrl()).toMatch(/^\/employees\/\d+$/));
    expect(api.calls("POST", /^\/api\/employees$/)).toHaveLength(1);
  });

  it("maps a server-side duplicate onto the offending field and keeps the entered values", async () => {
    const api = createFakeApi({ employees: [makeEmployee(1, { employeeId: "EMP-3001" })] });
    api.install();
    const { user } = renderWithProviders(<CreateEmployee />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Create employee" }));

    expect(await screen.findByText("Employee ID EMP-3001 is already in use")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Employee ID/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^Full name/)).toHaveValue("Ananya Iyer");
    expect(screen.getByLabelText(/^Annual salary/)).toHaveValue("1850000.50");
    expect(screen.getByRole("button", { name: "Create employee" })).toBeEnabled();
    expect(currentUrl()).toBe("/employees/new");
  });

  it("shows a general error banner when the server fails unexpectedly", async () => {
    const api = createFakeApi();
    api.install();
    api.failNext("POST", /^\/api\/employees$/, 500, { status: 500, code: "INTERNAL_ERROR", message: "An unexpected error occurred. Please try again later." });
    const { user } = renderWithProviders(<CreateEmployee />);
    await fillValidForm(user);

    await user.click(screen.getByRole("button", { name: "Create employee" }));

    expect(await screen.findByText("An unexpected error occurred. Please try again later.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Full name/)).toHaveValue("Ananya Iyer");
  });

  it("asks before discarding unsaved changes", async () => {
    createFakeApi().install();
    const { user } = renderWithProviders(<CreateEmployee />);
    await user.type(await screen.findByLabelText(/^Full name/), "Ana");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Discard unsaved changes?")).toBeInTheDocument();
    expect(navigationLog).toHaveLength(0);
    await user.click(within(dialog).getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText(/^Full name/)).toHaveValue("Ana");

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Discard changes" }));
    await waitFor(() => expect(currentUrl()).toBe("/employees"));
  });

  it("leaves immediately when nothing was edited", async () => {
    createFakeApi().install();
    const { user } = renderWithProviders(<CreateEmployee />);
    await screen.findByLabelText(/^Full name/);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => expect(currentUrl()).toBe("/employees"));
  });
});

describe("<EditEmployee>", () => {
  const existing = makeEmployee(7, {
    employeeId: "EMP-1007",
    fullName: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    department: { id: 2, name: "Design" },
    designation: "Design Lead",
    dateOfJoining: "2023-06-12",
    salary: 2000000,
    status: "ACTIVE",
  });

  beforeEach(() => {
    setUrl("/employees/7/edit");
    toast.success.mockClear();
  });

  it("pre-fills the form from the backend record", async () => {
    createFakeApi({ employees: [existing] }).install();
    renderWithProviders(<EditEmployee id="7" />);

    expect(await screen.findByLabelText(/^Full name/)).toHaveValue("Ananya Iyer");
    expect(screen.getByLabelText(/^Employee ID/)).toHaveValue("EMP-1007");
    expect(screen.getByLabelText(/^Email address/)).toHaveValue("ananya.iyer@example.com");
    await waitFor(() => expect(screen.getByLabelText(/^Department/)).toHaveValue("2"));
    expect(screen.getByLabelText(/^Designation/)).toHaveValue("Design Lead");
    expect(screen.getByLabelText(/^Date of joining/)).toHaveValue("2023-06-12");
    expect(screen.getByLabelText(/^Annual salary/)).toHaveValue("2000000");
    expect(screen.getByLabelText(/^Employment status/)).toHaveValue("ACTIVE");
  });

  it("shows the current department even when the department list arrives after the employee", async () => {
    const api = createFakeApi({ employees: [existing] });
    api.install();
    const releaseDepartments = api.holdNext("GET", /^\/api\/departments$/); // slow departments request
    const { user } = renderWithProviders(<EditEmployee id="7" />);

    // The employee has loaded; the department list is still in flight. Only now does it arrive.
    await waitFor(() => expect(api.calls("GET", /^\/api\/employees\/7$/)).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    releaseDepartments();

    expect(await screen.findByLabelText(/^Full name/)).toHaveValue("Ananya Iyer");
    await waitFor(() => expect(screen.getByLabelText(/^Department/)).toHaveValue("2"));

    // ...and the unchanged department survives validation when saving another change.
    await user.type(screen.getByLabelText(/^Designation/), " II");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(api.calls("PUT", /employees\/7/)).toHaveLength(1));
    expect(api.calls("PUT", /employees\/7/)[0]!.body).toMatchObject({ departmentId: 2, designation: "Design Lead II" });
  });

  it("saves only after a change and PUTs the full record", async () => {
    const api = createFakeApi({ employees: [existing] });
    api.install();
    const { user } = renderWithProviders(<EditEmployee id="7" />);
    const name = await screen.findByLabelText(/^Full name/);
    await waitFor(() => expect(screen.getByLabelText(/^Department/)).toHaveValue("2"));
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();

    await user.clear(name);
    await user.type(name, "Ananya R. Iyer");
    await user.selectOptions(screen.getByLabelText(/^Employment status/), "INACTIVE");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(api.calls("PUT", /^\/api\/employees\/7$/)).toHaveLength(1));
    expect(api.calls("PUT", /employees\/7/)[0]!.body).toMatchObject({
      fullName: "Ananya R. Iyer",
      status: "INACTIVE",
      departmentId: 2,
      salary: 2000000,
    });
    await waitFor(() => expect(currentUrl()).toBe("/employees/7"));
    expect(toast.success).toHaveBeenCalledWith("Ananya R. Iyer was updated");
    expect(api.state.employees[0]!.status).toBe("INACTIVE");
  });

  it("surfaces a duplicate email from the server on the email field", async () => {
    const api = createFakeApi({ employees: [existing, makeEmployee(8, { email: "taken@example.com" })] });
    api.install();
    const { user } = renderWithProviders(<EditEmployee id="7" />);
    const email = await screen.findByLabelText(/^Email address/);
    await waitFor(() => expect(screen.getByLabelText(/^Department/)).toHaveValue("2"));

    await user.clear(email);
    await user.type(email, "taken@example.com");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Email address taken@example.com is already in use")).toBeInTheDocument();
    expect(currentUrl()).toBe("/employees/7/edit");
  });

  it("shows a not-found state for an unknown employee", async () => {
    createFakeApi({ employees: [] }).install();
    renderWithProviders(<EditEmployee id="404" />);

    expect(await screen.findByText("Employee not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to employees" })).toHaveAttribute("href", "/employees");
  });
});

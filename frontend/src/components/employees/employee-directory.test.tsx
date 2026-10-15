import { act, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeApi, makeEmployee, manyEmployees } from "@/test/fake-api";
import { currentSearchParams, setUrl } from "@/test/navigation-mock";
import { renderWithProviders } from "@/test/render";
import { EmployeeDirectory } from "./employee-directory";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const rows = () => screen.findAllByTestId("employee-row");

describe("<EmployeeDirectory>", () => {
  beforeEach(() => setUrl("/employees"));

  it("renders employees with avatar initials, status, formatted salary and date, plus the total", async () => {
    createFakeApi({
      employees: [
        makeEmployee(1, { fullName: "Ananya Iyer", email: "ananya.iyer@example.com", salary: 1850000, dateOfJoining: "2023-06-12", status: "ACTIVE" }),
        makeEmployee(2, { fullName: "Rohan Das", status: "INACTIVE" }),
      ],
    }).install();

    renderWithProviders(<EmployeeDirectory />);

    const [first, second] = await rows();
    expect(within(first!).getByText("Ananya Iyer")).toBeInTheDocument();
    expect(within(first!).getByText("ananya.iyer@example.com")).toBeInTheDocument();
    expect(within(first!).getByText("AI")).toBeInTheDocument();
    expect(within(first!).getAllByText("Active").length).toBeGreaterThan(0);
    expect(within(first!).getByText("₹18,50,000")).toBeInTheDocument();
    expect(within(first!).getByText("12 Jun 2023")).toBeInTheDocument();
    expect(within(second!).getAllByText("Inactive").length).toBeGreaterThan(0);
    expect(screen.getByText(/2 people across your organisation/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Add employee/ })).toHaveAttribute("href", "/employees/new");
    expect(screen.getByRole("link", { name: "View Ananya Iyer" })).toHaveAttribute("href", "/employees/1");
    expect(screen.getByRole("link", { name: "Edit Ananya Iyer" })).toHaveAttribute("href", "/employees/1/edit");
  });

  it("shows a loading skeleton first", () => {
    createFakeApi({ employees: manyEmployees(3) }).install();
    renderWithProviders(<EmployeeDirectory />);
    expect(screen.getByRole("status", { name: "Loading employees" })).toBeInTheDocument();
  });

  it("paginates on the server and keeps the page count consistent", async () => {
    const api = createFakeApi({ employees: manyEmployees(25) });
    api.install();
    const { user } = renderWithProviders(<EmployeeDirectory />);

    expect(await rows()).toHaveLength(10);
    expect(screen.getByText("1–10")).toBeInTheDocument();
    expect(api.lastListQuery()!.get("page")).toBe("0");

    await user.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() => expect(screen.getByText("11–20")).toBeInTheDocument());
    expect(api.lastListQuery()!.get("page")).toBe("1");
    expect(currentSearchParams().get("page")).toBe("2"); // 1-based in the URL

    await user.click(screen.getByRole("button", { name: "Page 3" }));
    await waitFor(() => expect(screen.getByText("21–25")).toBeInTheDocument());
    expect(await rows()).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("changes the page size and returns to the first page", async () => {
    const api = createFakeApi({ employees: manyEmployees(25) });
    api.install();
    setUrl("/employees?page=2");
    const { user } = renderWithProviders(<EmployeeDirectory />);
    await rows();

    await user.selectOptions(screen.getByLabelText("Rows per page"), "20");

    await waitFor(() => expect(api.lastListQuery()!.get("size")).toBe("20"));
    expect(api.lastListQuery()!.get("page")).toBe("0");
    await waitFor(() => expect(screen.getByText("1–20")).toBeInTheDocument());
  });

  it("searches by name or email after a debounce and resets to page one", async () => {
    const api = createFakeApi({
      employees: [
        makeEmployee(1, { fullName: "Anuj Shrivastava", email: "anuj@example.com" }),
        makeEmployee(2, { fullName: "Priya Nair", email: "priya.nair@example.com" }),
        makeEmployee(3, { fullName: "Rohan Das", email: "anuj.friend@example.com" }),
      ],
    });
    api.install();
    const { user } = renderWithProviders(<EmployeeDirectory />);
    await rows();

    await user.type(screen.getByLabelText("Search employees"), "anuj");

    await waitFor(() => expect(screen.getAllByTestId("employee-row")).toHaveLength(2));
    expect(api.lastListQuery()!.get("search")).toBe("anuj");
    expect(api.lastListQuery()!.get("page")).toBe("0");
    expect(screen.queryByText("Priya Nair")).not.toBeInTheDocument();
    expect(screen.getByText(/2 employees match your filters/)).toBeInTheDocument();
    expect(currentSearchParams().get("search")).toBe("anuj");
    // typing four characters must not fire four requests
    expect(api.calls("GET", /^\/api\/employees$/).filter((c) => c.query.get("search")).length).toBe(1);
  });

  it("combines department, status and search filters", async () => {
    const api = createFakeApi({
      employees: [
        makeEmployee(1, { fullName: "Eng Active", department: { id: 1, name: "Engineering" }, status: "ACTIVE" }),
        makeEmployee(2, { fullName: "Eng Inactive", department: { id: 1, name: "Engineering" }, status: "INACTIVE" }),
        makeEmployee(3, { fullName: "Design Active", department: { id: 2, name: "Design" }, status: "ACTIVE" }),
      ],
    });
    api.install();
    const { user } = renderWithProviders(<EmployeeDirectory />);
    await rows();

    await user.selectOptions(screen.getByLabelText("Filter by department"), "Engineering");
    await waitFor(() => expect(screen.getAllByTestId("employee-row")).toHaveLength(2));

    await user.selectOptions(screen.getByLabelText("Filter by status"), "ACTIVE");
    await waitFor(() => expect(screen.getAllByTestId("employee-row")).toHaveLength(1));
    expect(screen.getByText("Eng Active")).toBeInTheDocument();
    const query = api.lastListQuery()!;
    expect(query.get("department")).toBe("Engineering");
    expect(query.get("status")).toBe("ACTIVE");
  });

  it("keeps earlier filter changes when a second one is made before the URL has settled", async () => {
    const api = createFakeApi({ employees: manyEmployees(12) });
    api.install();
    const { user } = renderWithProviders(<EmployeeDirectory />);
    await rows();

    // Two changes back-to-back, faster than the router can apply the first one.
    const department = screen.getByLabelText("Filter by department");
    const status = screen.getByLabelText("Filter by status");
    await act(async () => {
      await user.selectOptions(department, "Design");
      await user.selectOptions(status, "ACTIVE");
    });

    await waitFor(() => expect(currentSearchParams().get("department")).toBe("Design"));
    expect(currentSearchParams().get("status")).toBe("ACTIVE");
    await waitFor(() => {
      const query = api.lastListQuery()!;
      expect(query.get("department")).toBe("Design");
      expect(query.get("status")).toBe("ACTIVE");
    });
  });

  it("clears every filter at once", async () => {
    const api = createFakeApi({ employees: manyEmployees(12) });
    api.install();
    setUrl("/employees?department=Design&status=ACTIVE&search=person");
    const { user } = renderWithProviders(<EmployeeDirectory />);
    await rows();
    expect(screen.getByLabelText("Search employees")).toHaveValue("person");

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(screen.getByText(/12 people across/)).toBeInTheDocument());
    expect(screen.getByLabelText("Search employees")).toHaveValue("");
    expect(screen.getByLabelText("Filter by department")).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("sorts by a column and toggles direction", async () => {
    const api = createFakeApi({ employees: manyEmployees(5) });
    api.install();
    const { user } = renderWithProviders(<EmployeeDirectory />);
    await rows();

    await user.click(screen.getByRole("button", { name: /Salary/ }));
    await waitFor(() => expect(api.lastListQuery()!.get("sortBy")).toBe("salary"));
    expect(api.lastListQuery()!.get("sortDir")).toBe("asc");

    await user.click(screen.getByRole("button", { name: /Salary/ }));
    await waitFor(() => expect(api.lastListQuery()!.get("sortDir")).toBe("desc"));
    await waitFor(() => expect(within((screen.getAllByTestId("employee-row"))[0]!).getByText("Person 05")).toBeInTheDocument());
  });

  it("explains an empty database and offers to add the first employee", async () => {
    createFakeApi({ employees: [] }).install();
    renderWithProviders(<EmployeeDirectory />);

    expect(await screen.findByText("No employees yet")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Add employee/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });

  it("shows a no-results state when filters match nothing, with a way back", async () => {
    createFakeApi({ employees: manyEmployees(3) }).install();
    setUrl("/employees?search=zzzz");
    const { user } = renderWithProviders(<EmployeeDirectory />);

    expect(await screen.findByText("No matching employees")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0]!);
    expect(await rows()).toHaveLength(3);
  });

  it("shows an error state and recovers on retry", async () => {
    const api = createFakeApi({ employees: manyEmployees(3) });
    api.install();
    api.failNext("GET", /^\/api\/employees$/, 500, { status: 500, code: "INTERNAL_ERROR", message: "An unexpected error occurred. Please try again later." });
    const { user } = renderWithProviders(<EmployeeDirectory />);

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load employees");
    expect(screen.getByRole("alert")).toHaveTextContent("An unexpected error occurred");

    await user.click(screen.getByRole("button", { name: /Try again/ }));
    expect(await rows()).toHaveLength(3);
  });

  it("reports a network outage in plain language", async () => {
    const api = createFakeApi({ employees: manyEmployees(3) });
    api.install();
    api.networkDownOnce();
    renderWithProviders(<EmployeeDirectory />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to reach the server");
  });

  describe("delete", () => {
    it("asks for confirmation, and cancelling keeps the employee", async () => {
      const api = createFakeApi({ employees: [makeEmployee(1, { fullName: "Ananya Iyer" })] });
      api.install();
      const { user } = renderWithProviders(<EmployeeDirectory />);
      await rows();

      await user.click(screen.getByRole("button", { name: "Delete Ananya Iyer" }));
      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText("Delete Ananya Iyer?")).toBeInTheDocument();
      expect(within(dialog).getByText(/cannot be undone/)).toBeInTheDocument();
      expect(api.calls("DELETE", /employees/)).toHaveLength(0);

      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(api.calls("DELETE", /employees/)).toHaveLength(0);
      expect(screen.getByText("Ananya Iyer")).toBeInTheDocument();
    });

    it("deletes after confirmation and refreshes the list", async () => {
      const api = createFakeApi({ employees: [makeEmployee(1, { fullName: "Ananya Iyer" }), makeEmployee(2, { fullName: "Rohan Das" })] });
      api.install();
      const { user } = renderWithProviders(<EmployeeDirectory />);
      await rows();

      await user.click(screen.getByRole("button", { name: "Delete Ananya Iyer" }));
      await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete employee" }));

      await waitFor(() => expect(screen.queryByText("Ananya Iyer")).not.toBeInTheDocument());
      expect(api.calls("DELETE", /^\/api\/employees\/1$/)).toHaveLength(1);
      expect(api.calls("DELETE", /employees/)[0]!.headers["X-XSRF-TOKEN"]).toBe("test-csrf-token");
      expect(screen.getByText("Rohan Das")).toBeInTheDocument();
    });

    it("keeps the dialog open and shows the server error when deletion fails", async () => {
      const api = createFakeApi({ employees: [makeEmployee(1, { fullName: "Ananya Iyer" })] });
      api.install();
      api.failNext("DELETE", /employees\/1/, 500, { status: 500, code: "INTERNAL_ERROR", message: "The server ran into a problem." });
      const { user } = renderWithProviders(<EmployeeDirectory />);
      await rows();

      await user.click(screen.getByRole("button", { name: "Delete Ananya Iyer" }));
      await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete employee" }));

      expect(await within(screen.getByRole("alertdialog")).findByRole("alert")).toHaveTextContent("The server ran into a problem.");
      expect(screen.getByText("Ananya Iyer")).toBeInTheDocument();
    });

    it("steps back a page when the last row of the last page is deleted", async () => {
      const api = createFakeApi({ employees: manyEmployees(11) });
      api.install();
      setUrl("/employees?page=2");
      const { user } = renderWithProviders(<EmployeeDirectory />);
      expect(await rows()).toHaveLength(1);

      await user.click(screen.getByRole("button", { name: /^Delete Person/ }));
      await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete employee" }));

      await waitFor(() => expect(screen.getAllByTestId("employee-row")).toHaveLength(10));
      expect(currentSearchParams().get("page")).toBeNull();
    });
  });

  it("downloads a CSV for the current filters", async () => {
    const api = createFakeApi({ employees: manyEmployees(4) });
    api.install();
    setUrl("/employees?status=ACTIVE&search=person");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { user } = renderWithProviders(<EmployeeDirectory />);
    await rows();

    await user.click(screen.getByRole("button", { name: /Export CSV/ }));

    await waitFor(() => expect(api.calls("GET", /export/)).toHaveLength(1));
    const query = api.calls("GET", /export/)[0]!.query;
    expect(query.get("status")).toBe("ACTIVE");
    expect(query.get("search")).toBe("person");
    expect(query.get("page")).toBeNull(); // exports every page
    await waitFor(() => expect(click).toHaveBeenCalled());
    click.mockRestore();
  });
});

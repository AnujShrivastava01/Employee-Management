import { download, request } from "./client";
import type { Employee, EmployeeInput, EmployeeListParams, EmployeeStats, Page } from "./types";

function listQuery(params: EmployeeListParams) {
  return {
    page: params.page,
    size: params.size,
    search: params.search?.trim(),
    department: params.department,
    status: params.status,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  };
}

export const employeesApi = {
  list: (params: EmployeeListParams, signal?: AbortSignal) =>
    request<Page<Employee>>("/employees", { query: listQuery(params), signal }),

  get: (id: number | string, signal?: AbortSignal) => request<Employee>(`/employees/${id}`, { signal }),

  create: (input: EmployeeInput) => request<Employee>("/employees", { method: "POST", body: input }),

  update: (id: number | string, input: EmployeeInput) =>
    request<Employee>(`/employees/${id}`, { method: "PUT", body: input }),

  remove: (id: number | string) => request<void>(`/employees/${id}`, { method: "DELETE" }),

  stats: (signal?: AbortSignal) => request<EmployeeStats>("/employees/stats", { signal }),

  /** Exports exactly the rows the directory currently shows (all pages). */
  exportCsv: (params: Pick<EmployeeListParams, "search" | "department" | "status" | "sortBy" | "sortDir">) =>
    download("/employees/export", {
      search: params.search?.trim(),
      department: params.department,
      status: params.status,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    }),
};

import { request } from "./client";
import type { Department, DepartmentInput } from "./types";

export const departmentsApi = {
  list: (signal?: AbortSignal) => request<Department[]>("/departments", { signal }),
  create: (input: DepartmentInput) => request<Department>("/departments", { method: "POST", body: input }),
  update: (id: number, input: DepartmentInput) =>
    request<Department>(`/departments/${id}`, { method: "PUT", body: input }),
  remove: (id: number) => request<void>(`/departments/${id}`, { method: "DELETE" }),
};

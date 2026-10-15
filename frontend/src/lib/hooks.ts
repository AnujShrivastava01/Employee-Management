"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "./api/departments";
import { employeesApi } from "./api/employees";
import type { DepartmentInput, EmployeeInput, EmployeeListParams } from "./api/types";

export const queryKeys = {
  employees: ["employees"] as const,
  employeeList: (params: EmployeeListParams) => ["employees", "list", params] as const,
  employee: (id: string | number) => ["employees", "detail", String(id)] as const,
  stats: ["stats"] as const,
  departments: ["departments"] as const,
};

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: queryKeys.employeeList(params),
    queryFn: ({ signal }) => employeesApi.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employee(id),
    queryFn: ({ signal }) => employeesApi.get(id, signal),
  });
}

export function useEmployeeStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: ({ signal }) => employeesApi.stats(signal) });
}

export function useDepartments() {
  return useQuery({ queryKey: queryKeys.departments, queryFn: ({ signal }) => departmentsApi.list(signal) });
}

/** Anything that changes employees also changes dashboard numbers and department headcounts. */
function useInvalidateEmployeeData() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.employees }),
      client.invalidateQueries({ queryKey: queryKeys.stats }),
      client.invalidateQueries({ queryKey: queryKeys.departments }),
    ]);
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployeeData();
  return useMutation({ mutationFn: (input: EmployeeInput) => employeesApi.create(input), onSuccess: invalidate });
}

export function useUpdateEmployee(id: string | number) {
  const invalidate = useInvalidateEmployeeData();
  return useMutation({ mutationFn: (input: EmployeeInput) => employeesApi.update(id, input), onSuccess: invalidate });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployeeData();
  return useMutation({ mutationFn: (id: number) => employeesApi.remove(id), onSuccess: invalidate });
}

function useInvalidateDepartments() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.departments }),
      client.invalidateQueries({ queryKey: queryKeys.stats }),
    ]);
}

export function useSaveDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: DepartmentInput }) =>
      id === undefined ? departmentsApi.create(input) : departmentsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({ mutationFn: (id: number) => departmentsApi.remove(id), onSuccess: invalidate });
}

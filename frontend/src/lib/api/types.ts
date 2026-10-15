/** Wire types — kept in lock-step with the Spring Boot DTOs. */

export const EMPLOYMENT_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export interface DepartmentSummary {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: DepartmentSummary;
  designation: string;
  /** ISO date, yyyy-MM-dd */
  dateOfJoining: string;
  salary: number;
  status: EmploymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: number;
  designation: string;
  dateOfJoining: string;
  salary: number;
  status: EmploymentStatus;
}

export interface Page<T> {
  content: T[];
  /** Zero-based page index. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export const SORT_FIELDS = [
  "employeeId",
  "fullName",
  "email",
  "department",
  "designation",
  "dateOfJoining",
  "salary",
  "status",
  "createdAt",
] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = "asc" | "desc";

export interface EmployeeListParams {
  page: number;
  size: number;
  search?: string;
  department?: string;
  status?: EmploymentStatus;
  sortBy: SortField;
  sortDir: SortDirection;
}

export interface DepartmentHeadcount {
  department: string;
  count: number;
}

export interface HiringTrendPoint {
  /** yyyy-MM */
  month: string;
  count: number;
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalDepartments: number;
  departmentDistribution: DepartmentHeadcount[];
  hiringTrend: HiringTrendPoint[];
  recentlyJoined: Employee[];
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentInput {
  name: string;
  description?: string | null;
}

export interface CurrentUser {
  username: string;
  role: string;
}

export interface FieldErrorDetail {
  field: string;
  message: string;
}

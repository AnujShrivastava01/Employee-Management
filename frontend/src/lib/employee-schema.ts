import { z } from "zod";
import type { EmployeeInput } from "./api/types";
import { todayIso } from "./format";

/**
 * Client-side mirror of the backend validation (EmployeeRequest). The server remains the source of
 * truth — its messages are mapped back onto the form when it rejects a value this schema accepted.
 */

const EARLIEST_JOINING_DATE = "1980-01-01";
const MAX_FUTURE_DAYS = 90;

function addDays(iso: string, days: number): string {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return todayIso(new Date(y, m - 1, d + days));
}

export const employeeFormSchema = z.object({
  employeeId: z
    .string()
    .trim()
    .min(1, "Employee ID is required")
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]{1,29}$/, "Use 2–30 characters: letters, digits, '-' or '_'"),
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name must be at most 120 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .max(254, "Email address must be at most 254 characters")
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/, "Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9][0-9 ()-]{5,18}[0-9]$/, "Enter a valid phone number, e.g. +91 98765 43210"),
  departmentId: z.string().min(1, "Department is required"),
  designation: z
    .string()
    .trim()
    .min(1, "Designation is required")
    .max(100, "Designation must be at most 100 characters"),
  dateOfJoining: z
    .string()
    .min(1, "Date of joining is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .refine((value) => value >= EARLIEST_JOINING_DATE, "Date of joining cannot be before 1 Jan 1980")
    .refine(
      (value) => value <= addDays(todayIso(), MAX_FUTURE_DAYS),
      "Date of joining can be at most 90 days in the future",
    ),
  salary: z
    .string()
    .trim()
    .min(1, "Salary is required")
    .refine((value) => !Number.isNaN(Number(value)), "Enter a valid amount")
    .refine((value) => Number.isNaN(Number(value)) || Number(value) >= 0, "Salary cannot be negative")
    .refine(
      (value) => Number.isNaN(Number(value)) || Number(value) < 0 || /^\d*\.?\d{0,2}$/.test(value),
      "Use at most 2 decimal places",
    )
    .refine((value) => Number.isNaN(Number(value)) || Number(value) < 10_000_000_000, "Salary is too large"),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Select a status" }),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const emptyEmployeeForm: EmployeeFormValues = {
  employeeId: "",
  fullName: "",
  email: "",
  phone: "",
  departmentId: "",
  designation: "",
  dateOfJoining: "",
  salary: "",
  status: "ACTIVE",
};

export function toEmployeeInput(values: EmployeeFormValues): EmployeeInput {
  return {
    employeeId: values.employeeId.trim(),
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    departmentId: Number(values.departmentId),
    designation: values.designation.trim(),
    dateOfJoining: values.dateOfJoining,
    salary: Number(values.salary),
    status: values.status,
  };
}

import { describe, expect, it } from "vitest";
import { employeeFormSchema, emptyEmployeeForm, toEmployeeInput, type EmployeeFormValues } from "./employee-schema";
import { todayIso } from "./format";

const valid: EmployeeFormValues = {
  employeeId: "EMP-1001",
  fullName: "Ananya Iyer",
  email: "ananya.iyer@example.com",
  phone: "+91 98765 43210",
  departmentId: "1",
  designation: "Senior Software Engineer",
  dateOfJoining: "2023-06-12",
  salary: "1850000.50",
  status: "ACTIVE",
};

function errorsFor(overrides: Partial<EmployeeFormValues>) {
  const result = employeeFormSchema.safeParse({ ...valid, ...overrides });
  if (result.success) return {} as Record<string, string>;
  const map: Record<string, string> = {};
  for (const issue of result.error.issues) map[String(issue.path[0])] ??= issue.message;
  return map;
}

describe("employee form schema", () => {
  it("accepts a valid employee", () => {
    expect(employeeFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires every field", () => {
    const errors = errorsFor({ ...emptyEmployeeForm });
    expect(Object.keys(errors).sort()).toEqual(["dateOfJoining", "departmentId", "designation", "email", "employeeId", "fullName", "phone", "salary"]);
    expect(errors.employeeId).toBe("Employee ID is required");
    expect(errors.departmentId).toBe("Department is required");
  });

  it.each(["plain", "no@tld", "two@@example.com", "a b@example.com", "@example.com"])("rejects malformed email %s", (email) => {
    expect(errorsFor({ email }).email).toBe("Enter a valid email address");
  });

  it.each(["12", "abcdefghij", "+91 9876O 43210"])("rejects malformed phone %s", (phone) => {
    expect(errorsFor({ phone }).phone).toMatch(/valid phone/);
  });

  it("validates salary", () => {
    expect(errorsFor({ salary: "-1" }).salary).toBe("Salary cannot be negative");
    expect(errorsFor({ salary: "abc" }).salary).toBe("Enter a valid amount");
    expect(errorsFor({ salary: "10.123" }).salary).toBe("Use at most 2 decimal places");
    expect(errorsFor({ salary: "99999999999" }).salary).toBe("Salary is too large");
    expect(errorsFor({ salary: "0" }).salary).toBeUndefined();
  });

  it("validates employee id format and lengths", () => {
    expect(errorsFor({ employeeId: "E" }).employeeId).toMatch(/2–30 characters/);
    expect(errorsFor({ employeeId: "has space" }).employeeId).toMatch(/2–30 characters/);
    expect(errorsFor({ fullName: "A" }).fullName).toMatch(/at least 2/);
    expect(errorsFor({ fullName: "x".repeat(121) }).fullName).toMatch(/at most 120/);
    expect(errorsFor({ designation: "x".repeat(101) }).designation).toMatch(/at most 100/);
  });

  it("applies business rules to the joining date", () => {
    expect(errorsFor({ dateOfJoining: "1979-12-31" }).dateOfJoining).toMatch(/1 Jan 1980/);
    expect(errorsFor({ dateOfJoining: "2999-01-01" }).dateOfJoining).toMatch(/90 days/);
    expect(errorsFor({ dateOfJoining: todayIso() }).dateOfJoining).toBeUndefined();
  });

  it("trims whitespace before validating and converting", () => {
    const padded = { ...valid, fullName: "  Ananya Iyer  ", employeeId: " EMP-1001 " };
    expect(employeeFormSchema.safeParse(padded).success).toBe(true);
    const input = toEmployeeInput(padded);
    expect(input.fullName).toBe("Ananya Iyer");
    expect(input.employeeId).toBe("EMP-1001");
  });

  it("converts form strings into the API payload types", () => {
    expect(toEmployeeInput(valid)).toEqual({
      employeeId: "EMP-1001",
      fullName: "Ananya Iyer",
      email: "ananya.iyer@example.com",
      phone: "+91 98765 43210",
      departmentId: 1,
      designation: "Senior Software Engineer",
      dateOfJoining: "2023-06-12",
      salary: 1850000.5,
      status: "ACTIVE",
    });
  });
});

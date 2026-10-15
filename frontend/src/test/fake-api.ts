import { vi } from "vitest";
import type { Department, Employee, EmploymentStatus } from "@/lib/api/types";

/**
 * An in-memory stand-in for the Spring Boot API that honours the same contract
 * (paging, search, filters, sorting, validation errors, status codes). Installed as global `fetch`
 * so the real API client, hooks and components run unchanged.
 */

export interface RecordedCall {
  method: string;
  path: string;
  query: URLSearchParams;
  body?: unknown;
  headers: Record<string, string>;
}

interface Failure {
  method: string;
  pathPattern: RegExp;
  status: number;
  body: unknown;
  times: number;
}

export function makeDepartment(id: number, name: string, employeeCount = 0): Department {
  return { id, name, description: null, employeeCount, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
}

export function makeEmployee(id: number, overrides: Partial<Employee> = {}): Employee {
  return {
    id,
    employeeId: `EMP-${1000 + id}`,
    fullName: `Employee ${id}`,
    email: `employee${id}@example.com`,
    phone: "+91 98765 43210",
    department: { id: 1, name: "Engineering" },
    designation: "Software Engineer",
    dateOfJoining: "2024-03-15",
    salary: 1_200_000,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const apiError = (status: number, code: string, message: string, fieldErrors: { field: string; message: string }[] = []) =>
  json(status, { status, code, message, fieldErrors });

export function createFakeApi(initial: { employees?: Employee[]; departments?: Department[]; authenticated?: boolean } = {}) {
  const state = {
    employees: [...(initial.employees ?? [])],
    departments: [...(initial.departments ?? [makeDepartment(1, "Engineering"), makeDepartment(2, "Design")])],
    nextId: 1000,
    calls: [] as RecordedCall[],
    failures: [] as Failure[],
    holds: [] as { method: string; pathPattern: RegExp; gate: Promise<void> }[],
    authenticated: initial.authenticated ?? true,
  };

  const sorters: Record<string, (e: Employee) => string | number> = {
    employeeId: (e) => e.employeeId.toLowerCase(),
    fullName: (e) => e.fullName.toLowerCase(),
    email: (e) => e.email.toLowerCase(),
    department: (e) => e.department.name.toLowerCase(),
    designation: (e) => e.designation.toLowerCase(),
    dateOfJoining: (e) => e.dateOfJoining,
    salary: (e) => e.salary,
    status: (e) => e.status,
    createdAt: (e) => e.createdAt,
  };

  function list(query: URLSearchParams) {
    const page = Number(query.get("page") ?? 0);
    const size = Number(query.get("size") ?? 10);
    const search = query.get("search")?.toLowerCase();
    const department = query.get("department")?.toLowerCase();
    const status = query.get("status") as EmploymentStatus | null;
    const sortBy = query.get("sortBy") ?? "fullName";
    const dir = query.get("sortDir") === "desc" ? -1 : 1;

    let rows = state.employees.filter(
      (e) =>
        (!search || [e.fullName, e.email, e.employeeId].some((v) => v.toLowerCase().includes(search))) &&
        (!department || e.department.name.toLowerCase() === department) &&
        (!status || e.status === status),
    );
    const key = sorters[sortBy];
    if (!key) return apiError(400, "VALIDATION_ERROR", `Unsupported sort field '${sortBy}'`);
    rows = [...rows].sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));

    const totalPages = Math.ceil(rows.length / size);
    return json(200, {
      content: rows.slice(page * size, page * size + size),
      page,
      size,
      totalElements: rows.length,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  }

  function stats() {
    const dist = state.departments
      .map((d) => ({ department: d.name, count: state.employees.filter((e) => e.department.id === d.id).length }))
      .sort((a, b) => b.count - a.count);
    const active = state.employees.filter((e) => e.status === "ACTIVE").length;
    return json(200, {
      totalEmployees: state.employees.length,
      activeEmployees: active,
      inactiveEmployees: state.employees.length - active,
      totalDepartments: state.departments.length,
      departmentDistribution: dist,
      recentlyJoined: [...state.employees].sort((a, b) => b.dateOfJoining.localeCompare(a.dateOfJoining)).slice(0, 5),
    });
  }

  function validate(body: Record<string, unknown>, excludeId?: number) {
    const normalizedId = String(body.employeeId).toUpperCase(); // the real API normalises identifiers the same way
    const dup = state.employees.find((e) => e.id !== excludeId && e.employeeId.toUpperCase() === normalizedId);
    if (dup) return apiError(409, "DUPLICATE_EMPLOYEE_ID", `Employee ID ${normalizedId} is already in use`, [{ field: "employeeId", message: `Employee ID ${normalizedId} is already in use` }]);
    const dupMail = state.employees.find((e) => e.id !== excludeId && e.email.toLowerCase() === String(body.email).toLowerCase());
    if (dupMail) return apiError(409, "DUPLICATE_EMAIL", `Email address ${body.email} is already in use`, [{ field: "email", message: `Email address ${body.email} is already in use` }]);
    return null;
  }

  function toEmployee(id: number, body: Record<string, unknown>): Employee {
    const department = state.departments.find((d) => d.id === body.departmentId) ?? state.departments[0]!;
    return makeEmployee(id, {
      employeeId: String(body.employeeId).toUpperCase(),
      fullName: String(body.fullName),
      email: String(body.email).toLowerCase(),
      phone: String(body.phone),
      department: { id: department.id, name: department.name },
      designation: String(body.designation),
      dateOfJoining: String(body.dateOfJoining),
      salary: Number(body.salary),
      status: body.status as EmploymentStatus,
    });
  }

  function route(method: string, path: string, query: URLSearchParams, body: Record<string, unknown> | undefined): Response {
    if (path === "/api/auth/csrf" && method === "GET") {
      document.cookie = "XSRF-TOKEN=test-csrf-token; path=/";
      return new Response(null, { status: 204 });
    }
    if (path === "/api/auth/me") return state.authenticated ? json(200, { username: "admin", role: "ADMIN" }) : apiError(401, "UNAUTHORIZED", "Authentication is required");
    if (path === "/api/auth/login" && method === "POST") {
      if (body?.password === "correct-password") {
        state.authenticated = true;
        return json(200, { username: String(body.username), role: "ADMIN" });
      }
      return apiError(401, "UNAUTHORIZED", "Invalid username or password");
    }
    if (path === "/api/auth/logout" && method === "POST") {
      state.authenticated = false;
      return new Response(null, { status: 204 });
    }
    if (!state.authenticated) return apiError(401, "UNAUTHORIZED", "Authentication is required");

    if (path === "/api/departments") {
      if (method === "GET") return json(200, state.departments.map((d) => ({ ...d, employeeCount: state.employees.filter((e) => e.department.id === d.id).length })));
      if (method === "POST") {
        const name = String(body?.name);
        if (state.departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
          return apiError(409, "DUPLICATE_DEPARTMENT", `A department named '${name}' already exists`, [{ field: "name", message: `A department named '${name}' already exists` }]);
        }
        const created = makeDepartment(state.nextId++, name);
        state.departments.push(created);
        return json(201, created);
      }
    }
    const dept = /^\/api\/departments\/(\d+)$/.exec(path);
    if (dept && method === "DELETE") {
      const id = Number(dept[1]);
      const target = state.departments.find((d) => d.id === id);
      if (!target) return apiError(404, "NOT_FOUND", `Department with id ${id} was not found`);
      if (state.employees.some((e) => e.department.id === id)) return apiError(409, "DEPARTMENT_IN_USE", `Department '${target.name}' still has employees. Reassign them before deleting it.`);
      state.departments = state.departments.filter((d) => d.id !== id);
      return new Response(null, { status: 204 });
    }

    if (path === "/api/employees/stats") return stats();
    if (path === "/api/employees/export") {
      const rows = state.employees.map((e) => [e.employeeId, e.fullName, e.email].join(","));
      return new Response(["Employee ID,Full Name,Email", ...rows].join("\r\n"), {
        status: 200,
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="employees-2026-10-15.csv"' },
      });
    }
    if (path === "/api/employees") {
      if (method === "GET") return list(query);
      if (method === "POST") {
        const conflict = validate(body ?? {});
        if (conflict) return conflict;
        const created = toEmployee(state.nextId++, body ?? {});
        state.employees.push(created);
        return json(201, created);
      }
    }
    const emp = /^\/api\/employees\/(\d+)$/.exec(path);
    if (emp) {
      const id = Number(emp[1]);
      const existing = state.employees.find((e) => e.id === id);
      if (!existing) return apiError(404, "NOT_FOUND", `Employee with id ${id} was not found`);
      if (method === "GET") return json(200, existing);
      if (method === "PUT") {
        const conflict = validate(body ?? {}, id);
        if (conflict) return conflict;
        const updated = { ...toEmployee(id, body ?? {}), createdAt: existing.createdAt };
        state.employees = state.employees.map((e) => (e.id === id ? updated : e));
        return json(200, updated);
      }
      if (method === "DELETE") {
        state.employees = state.employees.filter((e) => e.id !== id);
        return new Response(null, { status: 204 });
      }
    }
    return apiError(404, "NOT_FOUND", "The requested resource was not found");
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input), "http://localhost");
    const method = (init?.method ?? "GET").toUpperCase();
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>));
    state.calls.push({ method, path: url.pathname, query: url.searchParams, body, headers });

    const hold = state.holds.find((h) => h.method === method && h.pathPattern.test(url.pathname));
    if (hold) {
      state.holds = state.holds.filter((h) => h !== hold);
      await hold.gate;
    }

    const failure = state.failures.find((f) => f.times > 0 && f.method === method && f.pathPattern.test(url.pathname));
    if (failure) {
      failure.times--;
      return json(failure.status, failure.body);
    }
    return route(method, url.pathname, url.searchParams, body);
  });

  return {
    state,
    install: () => vi.stubGlobal("fetch", fetchMock),
    /** Make the next `times` matching requests fail with the given status/body. */
    failNext(method: string, pathPattern: RegExp, status: number, body: unknown = { status, code: "ERROR", message: "Boom" }, times = 1) {
      state.failures.push({ method, pathPattern, status, body, times });
    },
    /** Keeps the next matching request pending until the returned function is called (simulates a slow server). */
    holdNext(method: string, pathPattern: RegExp) {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      state.holds.push({ method, pathPattern, gate });
      return release;
    },
    /** Simulates the network being down for the next request. */
    networkDownOnce() {
      fetchMock.mockImplementationOnce(async () => {
        throw new TypeError("Failed to fetch");
      });
    },
    calls: (method: string, pathPattern: RegExp) => state.calls.filter((c) => c.method === method && pathPattern.test(c.path)),
    lastListQuery: () => [...state.calls].reverse().find((c) => c.method === "GET" && c.path === "/api/employees")?.query,
  };
}

export function manyEmployees(count: number): Employee[] {
  return Array.from({ length: count }, (_, i) =>
    makeEmployee(i + 1, {
      fullName: `Person ${String(i + 1).padStart(2, "0")}`,
      email: `person${i + 1}@example.com`,
      department: i % 3 === 0 ? { id: 2, name: "Design" } : { id: 1, name: "Engineering" },
      status: i % 4 === 0 ? "INACTIVE" : "ACTIVE",
      salary: 100_000 + i * 10_000,
    }),
  );
}

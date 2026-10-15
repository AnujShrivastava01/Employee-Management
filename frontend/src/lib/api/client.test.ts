import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, buildUrl, download, request, setUnauthorizedHandler } from "./client";
import { createFakeApi } from "@/test/fake-api";

afterEach(() => setUnauthorizedHandler(null));

describe("api client", () => {
  it("builds URLs and drops empty query values", () => {
    expect(buildUrl("/employees", { page: 0, search: "", department: undefined, status: "ACTIVE" })).toBe("/api/employees?page=0&status=ACTIVE");
    expect(buildUrl("/employees/stats")).toBe("/api/employees/stats");
  });

  it("fetches the CSRF token before the first mutating call and sends it as a header", async () => {
    const api = createFakeApi();
    api.install();

    await request("/employees", { method: "POST", body: { employeeId: "EMP-1" } });

    expect(api.calls("GET", /\/auth\/csrf/)).toHaveLength(1);
    const post = api.calls("POST", /\/employees$/)[0]!;
    expect(post.headers["X-XSRF-TOKEN"]).toBe("test-csrf-token");
    expect(post.headers["Content-Type"]).toBe("application/json");
  });

  it("does not send a CSRF header on reads", async () => {
    const api = createFakeApi();
    api.install();

    await request("/departments");

    expect(api.calls("GET", /\/departments/)[0]!.headers["X-XSRF-TOKEN"]).toBeUndefined();
    expect(api.calls("GET", /\/auth\/csrf/)).toHaveLength(0);
  });

  it("turns error responses into ApiError with code and field errors", async () => {
    const api = createFakeApi({ employees: [] });
    api.install();
    api.failNext("POST", /\/employees$/, 409, {
      status: 409,
      code: "DUPLICATE_EMAIL",
      message: "Email address a@b.co is already in use",
      fieldErrors: [{ field: "email", message: "Email address a@b.co is already in use" }],
    });

    const error = await request("/employees", { method: "POST", body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: "DUPLICATE_EMAIL", message: "Email address a@b.co is already in use" });
    expect((error as ApiError).fieldErrors).toEqual([{ field: "email", message: "Email address a@b.co is already in use" }]);
  });

  it("reports unreachable servers as network errors", async () => {
    const api = createFakeApi();
    api.install();
    api.networkDownOnce();

    const error = await request("/departments").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkError).toBe(true);
    expect((error as ApiError).message).toMatch(/Unable to reach the server/);
  });

  it("falls back to a friendly message when the body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>bad gateway</html>", { status: 502 })));

    const error = await request("/departments").catch((e: unknown) => e);

    expect((error as ApiError).message).toMatch(/server ran into a problem/);
    expect((error as ApiError).message).not.toMatch(/html/i);
  });

  it("invokes the unauthorized handler on 401 unless told otherwise", async () => {
    const api = createFakeApi({ authenticated: false });
    api.install();
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await request("/departments").catch(() => undefined);
    expect(handler).toHaveBeenCalledTimes(1);

    await request("/departments", { skipUnauthorizedHandler: true }).catch(() => undefined);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("returns undefined for 204 responses", async () => {
    const api = createFakeApi({ employees: [] });
    api.install();
    api.state.employees.push({ id: 5 } as never);
    await expect(request("/employees/5", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("extracts the filename when downloading", async () => {
    const api = createFakeApi();
    api.install();

    const file = await download("/employees/export", { status: "ACTIVE" });

    expect(file.filename).toBe("employees-2026-10-15.csv");
    expect(await file.blob.text()).toContain("Employee ID,Full Name,Email");
    expect(api.calls("GET", /export/)[0]!.query.get("status")).toBe("ACTIVE");
  });
});

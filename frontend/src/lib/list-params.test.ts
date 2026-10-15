import { describe, expect, it } from "vitest";
import { DEFAULT_LIST_PARAMS, hasActiveFilters, parseListParams, serializeListParams } from "./list-params";

describe("list params (URL state)", () => {
  it("falls back to defaults for an empty query string", () => {
    expect(parseListParams(new URLSearchParams(""))).toEqual({ ...DEFAULT_LIST_PARAMS, search: undefined, department: undefined, status: undefined });
  });

  it("treats the URL page as 1-based and the API page as zero-based", () => {
    expect(parseListParams(new URLSearchParams("page=3")).page).toBe(2);
    expect(parseListParams(new URLSearchParams("page=1")).page).toBe(0);
    expect(serializeListParams({ ...DEFAULT_LIST_PARAMS, page: 2 })).toBe("page=3");
  });

  it("sanitises hostile or invalid values", () => {
    const parsed = parseListParams(new URLSearchParams("page=-4&size=9999&sortBy=password&sortDir=sideways&status=RETIRED"));
    expect(parsed).toMatchObject({ page: 0, size: 10, sortBy: "fullName", sortDir: "asc", status: undefined });
    expect(parseListParams(new URLSearchParams("page=abc")).page).toBe(0);
  });

  it("round-trips non-default state and omits defaults", () => {
    const params = { page: 1, size: 20, search: "ana", department: "Engineering", status: "ACTIVE" as const, sortBy: "salary" as const, sortDir: "desc" as const };
    const qs = serializeListParams(params);
    expect(parseListParams(new URLSearchParams(qs))).toEqual(params);
    expect(serializeListParams(DEFAULT_LIST_PARAMS)).toBe("");
  });

  it("detects active filters", () => {
    expect(hasActiveFilters(DEFAULT_LIST_PARAMS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_LIST_PARAMS, search: "x" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_LIST_PARAMS, status: "INACTIVE" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_LIST_PARAMS, sortBy: "salary" })).toBe(false);
  });
});

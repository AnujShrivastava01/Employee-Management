import { SORT_FIELDS, type EmployeeListParams, type EmploymentStatus, type SortDirection, type SortField } from "./api/types";

export const DEFAULT_LIST_PARAMS: EmployeeListParams = {
  page: 0,
  size: 10,
  sortBy: "fullName",
  sortDir: "asc",
};

const PAGE_SIZES = [10, 20, 50];

/**
 * The directory's state lives in the URL so it can be bookmarked, shared and survives reloads.
 * `page` in the URL is 1-based for humans; everywhere else (and on the API) it is zero-based.
 */
export function parseListParams(search: URLSearchParams): EmployeeListParams {
  const pageNumber = Number.parseInt(search.get("page") ?? "1", 10);
  const size = Number.parseInt(search.get("size") ?? "", 10);
  const sortBy = search.get("sortBy") as SortField | null;
  const sortDir = search.get("sortDir");
  const status = search.get("status");

  return {
    page: Number.isFinite(pageNumber) && pageNumber > 1 ? pageNumber - 1 : 0,
    size: PAGE_SIZES.includes(size) ? size : DEFAULT_LIST_PARAMS.size,
    search: search.get("search")?.trim() || undefined,
    department: search.get("department") || undefined,
    status: status === "ACTIVE" || status === "INACTIVE" ? (status as EmploymentStatus) : undefined,
    sortBy: sortBy && (SORT_FIELDS as readonly string[]).includes(sortBy) ? sortBy : DEFAULT_LIST_PARAMS.sortBy,
    sortDir: (sortDir === "desc" ? "desc" : "asc") as SortDirection,
  };
}

/** Serialises only values that differ from the defaults to keep URLs short. */
export function serializeListParams(params: EmployeeListParams): string {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.department) search.set("department", params.department);
  if (params.status) search.set("status", params.status);
  if (params.page > 0) search.set("page", String(params.page + 1));
  if (params.size !== DEFAULT_LIST_PARAMS.size) search.set("size", String(params.size));
  if (params.sortBy !== DEFAULT_LIST_PARAMS.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortDir !== DEFAULT_LIST_PARAMS.sortDir) search.set("sortDir", params.sortDir);
  return search.toString();
}

export function hasActiveFilters(params: EmployeeListParams): boolean {
  return Boolean(params.search || params.department || params.status);
}

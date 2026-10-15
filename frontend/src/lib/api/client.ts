import type { FieldErrorDetail } from "./types";

/** Same-origin base path; Next.js proxies it to the Spring Boot API (see next.config.ts). */
export const API_BASE = "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldErrorDetail[];

  constructor(status: number, message: string, code = "UNKNOWN", fieldErrors: FieldErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** Do not trigger the global "session expired" handler on 401 (used by the login call). */
  skipUnauthorizedHandler?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

/** The auth layer registers a callback that sends the user back to the login page. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function buildUrl(path: string, query?: Query): string {
  const search = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

async function csrfToken(): Promise<string | undefined> {
  let token = readCookie("XSRF-TOKEN");
  if (!token) {
    // The backend issues the CSRF cookie on any response; ask for it explicitly the first time.
    await fetch(`${API_BASE}/auth/csrf`, { credentials: "same-origin" }).catch(() => undefined);
    token = readCookie("XSRF-TOKEN");
  }
  return token;
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: { message?: string; code?: string; fieldErrors?: FieldErrorDetail[] } | undefined;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }
  const fallback =
    response.status >= 500
      ? "The server ran into a problem. Please try again in a moment."
      : `Request failed (${response.status})`;
  return new ApiError(response.status, payload?.message ?? fallback, payload?.code, payload?.fieldErrors ?? []);
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const token = await csrfToken();
    if (token) headers["X-XSRF-TOKEN"] = token;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      credentials: "same-origin",
      signal: options.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "Unable to reach the server. Check your connection and try again.", "NETWORK_ERROR");
  }

  if (!response.ok) {
    if (response.status === 401 && !options.skipUnauthorizedHandler) unauthorizedHandler?.();
    throw await toApiError(response);
  }
  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface DownloadedFile {
  blob: Blob;
  filename: string;
}

export async function download(path: string, query?: Query): Promise<DownloadedFile> {
  const response = await send(path, { query });
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "download.csv";
  return { blob: await response.blob(), filename };
}

/** Triggers a real browser download for a blob. */
export function saveFile({ blob, filename }: DownloadedFile) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

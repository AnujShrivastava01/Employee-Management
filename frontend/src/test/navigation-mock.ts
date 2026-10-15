/**
 * Minimal in-memory replacement for `next/navigation`, so components that keep state in the URL
 * (search params) behave realistically in tests. Install with:
 *   vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
 */
import { useSyncExternalStore } from "react";

let current = "/";
const listeners = new Set<() => void>();
export const navigationLog: { method: "push" | "replace"; url: string }[] = [];

/** Like the real App Router, navigation settles asynchronously (after the current event handlers finish). */
function go(method: "push" | "replace", url: string) {
  navigationLog.push({ method, url });
  setTimeout(() => {
    current = url;
    listeners.forEach((listener) => listener());
  }, 20);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => current;

const router = {
  push: (url: string) => go("push", url),
  replace: (url: string) => go("replace", url),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
};

export function setUrl(url: string) {
  current = url;
  navigationLog.length = 0;
  listeners.forEach((listener) => listener());
}

export function currentUrl() {
  return current;
}

export function currentSearchParams() {
  return new URLSearchParams(current.split("?")[1] ?? "");
}

export const useRouter = () => router;
export const usePathname = () => useSyncExternalStore(subscribe, snapshot, snapshot).split("?")[0] ?? "/";
export const useSearchParams = () => new URLSearchParams(useSyncExternalStore(subscribe, snapshot, snapshot).split("?")[1] ?? "");

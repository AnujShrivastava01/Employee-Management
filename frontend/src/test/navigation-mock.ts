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
const pending = new Set<ReturnType<typeof setTimeout>>();
let delayMs = 20;

/** Slows the simulated router down, to exercise "user keeps interacting while navigation is in flight". */
export function setNavigationDelay(ms: number) {
  delayMs = ms;
}

function go(method: "push" | "replace", url: string) {
  navigationLog.push({ method, url });
  const timer = setTimeout(() => {
    pending.delete(timer);
    current = url;
    listeners.forEach((listener) => listener());
  }, delayMs);
  pending.add(timer);
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
  pending.forEach(clearTimeout); // a navigation started by a previous test must not land in this one
  pending.clear();
  delayMs = 20;
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

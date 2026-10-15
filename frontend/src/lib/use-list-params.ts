"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import type { EmployeeListParams } from "./api/types";
import { parseListParams, serializeListParams } from "./list-params";

/** Reads the directory state from the URL and exposes a patch-style updater. */
export function useListParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const serialized = searchParams.toString();
  const params = React.useMemo(() => parseListParams(new URLSearchParams(serialized)), [serialized]);

  // router.replace() settles asynchronously, so two quick changes (e.g. picking a department and then a
  // status, or a debounced search firing right after a filter change) would each start from the same stale
  // URL and the second would silently drop the first. `latest` always holds the most recently requested state.
  const latest = React.useRef(params);
  React.useEffect(() => {
    latest.current = params;
  }, [params]);

  const update = React.useCallback(
    (patch: Partial<EmployeeListParams>) => {
      // Changing anything except the page itself sends the user back to the first page.
      const resetPage = !("page" in patch);
      const next = { ...latest.current, ...(resetPage ? { page: 0 } : {}), ...patch };
      latest.current = next;
      const qs = serializeListParams(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const reset = React.useCallback(() => update({ search: undefined, department: undefined, status: undefined }), [update]);

  return { params, update, reset };
}

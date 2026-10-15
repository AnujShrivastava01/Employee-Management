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

  const update = React.useCallback(
    (patch: Partial<EmployeeListParams>) => {
      // Changing anything except the page itself sends the user back to the first page.
      const resetPage = !("page" in patch);
      const next = { ...params, ...(resetPage ? { page: 0 } : {}), ...patch };
      const qs = serializeListParams(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const reset = React.useCallback(() => update({ search: undefined, department: undefined, status: undefined }), [update]);

  return { params, update, reset };
}

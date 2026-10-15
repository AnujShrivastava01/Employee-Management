"use client";

import { Search, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Department, EmployeeListParams, EmploymentStatus } from "@/lib/api/types";
import { hasActiveFilters } from "@/lib/list-params";

interface EmployeeFiltersProps {
  params: EmployeeListParams;
  departments: Department[];
  onChange: (patch: Partial<EmployeeListParams>) => void;
  onClear: () => void;
  debounceMs?: number;
}

export function EmployeeFilters({ params, departments, onChange, onClear, debounceMs = 300 }: EmployeeFiltersProps) {
  const [text, setText] = React.useState(params.search ?? "");

  // Keep the box in sync when the URL changes from elsewhere (clear filters, topbar search, back button).
  React.useEffect(() => setText(params.search ?? ""), [params.search]);

  // Push typing to the URL after a short pause so each keystroke does not hit the API.
  React.useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === (params.search ?? "")) return;
    const timer = setTimeout(() => onChange({ search: trimmed || undefined }), debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing, not to every params change
  }, [text]);

  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
      <div className="relative flex-1 md:max-w-xs">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Search employees"
          placeholder="Search by name, email or ID"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Select
          aria-label="Filter by department"
          value={params.department ?? ""}
          onChange={(event) => onChange({ department: event.target.value || undefined })}
          className="w-full sm:w-48"
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.name}>
              {department.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by status"
          value={params.status ?? ""}
          onChange={(event) => onChange({ status: (event.target.value || undefined) as EmploymentStatus | undefined })}
          className="w-full sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>

        {hasActiveFilters(params) && (
          <Button variant="ghost" onClick={onClear}>
            <X /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

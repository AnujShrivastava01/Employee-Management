"use client";

import { Download, Loader2, Plus, SearchX, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, errorMessage } from "@/components/common/error-state";
import { Pagination } from "@/components/common/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveFile } from "@/lib/api/client";
import { employeesApi } from "@/lib/api/employees";
import type { Employee, SortField } from "@/lib/api/types";
import { useDepartments, useEmployees } from "@/lib/hooks";
import { hasActiveFilters } from "@/lib/list-params";
import { useListParams } from "@/lib/use-list-params";
import { DeleteEmployeeDialog } from "./delete-employee-dialog";
import { EmployeeFilters } from "./employee-filters";
import { EmployeeTable, EmployeeTableSkeleton } from "./employee-table";

export function EmployeeDirectory() {
  const { params, update, reset } = useListParams();
  const employees = useEmployees(params);
  const departments = useDepartments();
  const [pendingDelete, setPendingDelete] = React.useState<Employee | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const data = employees.data;
  const filtered = hasActiveFilters(params);

  // If the current page disappeared (e.g. the last row was deleted), step back to the last page that exists.
  React.useEffect(() => {
    if (data && data.content.length === 0 && data.totalPages > 0 && params.page >= data.totalPages) {
      update({ page: data.totalPages - 1 });
    }
  }, [data, params.page, update]);

  const onSort = React.useCallback(
    (field: SortField) => {
      update(
        params.sortBy === field
          ? { sortDir: params.sortDir === "asc" ? "desc" : "asc" }
          : { sortBy: field, sortDir: "asc" },
      );
    },
    [params.sortBy, params.sortDir, update],
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      saveFile(await employeesApi.exportCsv(params));
      toast.success("Export ready — your download has started");
    } catch (error) {
      toast.error(`Export failed: ${errorMessage(error)}`);
    } finally {
      setExporting(false);
    }
  };

  const total = data?.totalElements;
  const description = data
    ? filtered
      ? `${data.totalElements} ${data.totalElements === 1 ? "employee matches" : "employees match"} your filters`
      : `${data.totalElements} ${data.totalElements === 1 ? "person" : "people"} across your organisation`
    : "Browse, search and manage your people";

  let body: React.ReactNode;
  if (employees.isPending) {
    body = <EmployeeTableSkeleton />;
  } else if (employees.isError && !data) {
    body = <ErrorState error={employees.error} title="We couldn't load employees" onRetry={() => employees.refetch()} />;
  } else if (data && data.totalElements === 0 && !filtered) {
    body = (
      <EmptyState
        icon={Users}
        title="No employees yet"
        description="Add your first employee to start building your directory."
        action={
          <Button asChild>
            <Link href="/employees/new">
              <UserPlus /> Add employee
            </Link>
          </Button>
        }
      />
    );
  } else if (data && data.content.length === 0 && data.totalElements === 0) {
    body = (
      <EmptyState
        icon={SearchX}
        title="No matching employees"
        description="Nothing matches your current search and filters. Try different keywords or clear the filters."
        action={
          <Button variant="secondary" onClick={reset}>
            Clear filters
          </Button>
        }
      />
    );
  } else if (data) {
    body = (
      <>
        <EmployeeTable
          employees={data.content}
          sortBy={params.sortBy}
          sortDir={params.sortDir}
          onSort={onSort}
          onDelete={setPendingDelete}
          isRefreshing={employees.isFetching}
        />
        {employees.isError && (
          <p role="alert" className="border-t border-border bg-danger-soft px-4 py-2 text-sm text-danger">
            Couldn&apos;t refresh the list: {errorMessage(employees.error)}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Employees"
        description={description}
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Employees" }]}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={exporting || total === 0}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />}
              Export CSV
            </Button>
            <Button asChild>
              <Link href="/employees/new">
                <Plus /> Add employee
              </Link>
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <EmployeeFilters params={params} departments={departments.data ?? []} onChange={update} onClear={reset} />
        {body}
        {data && data.totalElements > 0 && (
          <Pagination
            page={data.page}
            size={data.size}
            totalElements={data.totalElements}
            totalPages={data.totalPages}
            onPageChange={(page) => update({ page })}
            onSizeChange={(size) => update({ size })}
          />
        )}
      </Card>

      <DeleteEmployeeDialog employee={pendingDelete} onClose={() => setPendingDelete(null)} />
    </>
  );
}

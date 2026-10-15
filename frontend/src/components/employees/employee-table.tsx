"use client";

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Employee, SortDirection, SortField } from "@/lib/api/types";
import { formatDate, formatSalary } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmployeeAvatar } from "./employee-avatar";
import { StatusBadge } from "./status-badge";

interface EmployeeTableProps {
  employees: Employee[];
  sortBy: SortField;
  sortDir: SortDirection;
  onSort: (field: SortField) => void;
  onDelete: (employee: Employee) => void;
  /** True while a new page/filter is loading; dims the rows instead of replacing them with a spinner. */
  isRefreshing?: boolean;
}

// Secondary columns drop out on narrower screens; the primary cell keeps the essentials visible.
// Row links are dynamic, per-record routes: prefetching them would fire up to 2 RSC requests per visible row
// (and raced with immediate clicks during testing), so they are fetched on demand instead.
// Breakpoints are tuned to the available content width (the 16rem sidebar appears from `lg`).
const RESPONSIVE: Record<string, string> = {
  department: "hidden md:table-cell",
  status: "hidden md:table-cell",
  dateOfJoining: "hidden xl:table-cell",
  salary: "hidden xl:table-cell text-right",
  employeeId: "hidden 2xl:table-cell",
};

function SortableHeader({ label, field, sortBy, sortDir, onSort, align }: {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortDir: SortDirection;
  onSort: (field: SortField) => void;
  align?: "right";
}) {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "-mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 uppercase tracking-wide transition-colors hover:bg-black/5 hover:text-foreground",
        active && "text-foreground",
        align === "right" && "flex-row-reverse",
      )}
    >
      {label}
      <Icon aria-hidden className={cn("size-3.5", !active && "opacity-50")} />
      <span className="sr-only">{active ? `, sorted ${sortDir === "asc" ? "ascending" : "descending"}` : ", click to sort"}</span>
    </button>
  );
}

export function EmployeeTable({ employees, sortBy, sortDir, onSort, onDelete, isRefreshing }: EmployeeTableProps) {
  const columns = React.useMemo<ColumnDef<Employee>[]>(() => {
    const sortable = (label: string, field: SortField, align?: "right") => (
      <SortableHeader label={label} field={field} sortBy={sortBy} sortDir={sortDir} onSort={onSort} align={align} />
    );
    return [
      {
        id: "fullName",
        header: () => sortable("Employee", "fullName"),
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex items-center gap-3">
              <EmployeeAvatar name={e.fullName} />
              <div className="min-w-0 max-w-[10.5rem] sm:max-w-[16rem]">
                <Link href={`/employees/${e.id}`} prefetch={false} className="block truncate font-semibold text-foreground hover:text-accent hover:underline">
                  {e.fullName}
                </Link>
                <span className="block truncate text-xs text-muted-foreground">{e.email}</span>
                <span className="mt-1 block md:hidden">
                  <StatusBadge status={e.status} />
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "employeeId",
        header: () => sortable("ID", "employeeId"),
        cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{row.original.employeeId}</span>,
      },
      {
        id: "department",
        header: () => sortable("Department", "department"),
        cell: ({ row }) => (
          <div className="min-w-0 max-w-[14rem]">
            <span className="block truncate">{row.original.department.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.original.designation}</span>
          </div>
        ),
      },
      {
        id: "dateOfJoining",
        header: () => sortable("Joined", "dateOfJoining"),
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.dateOfJoining)}</span>,
      },
      {
        id: "salary",
        header: () => sortable("Salary", "salary", "right"),
        cell: ({ row }) => <span className="whitespace-nowrap tabular-nums">{formatSalary(row.original.salary)}</span>,
      },
      {
        id: "status",
        header: () => sortable("Status", "status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex justify-end gap-0.5">
              <Button asChild variant="ghost" size="icon">
                <Link href={`/employees/${e.id}`} prefetch={false} aria-label={`View ${e.fullName}`} title="View">
                  <Eye />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link href={`/employees/${e.id}/edit`} prefetch={false} aria-label={`Edit ${e.fullName}`} title="Edit">
                  <Pencil />
                </Link>
              </Button>
              <Button variant="danger-ghost" size="icon" aria-label={`Delete ${e.fullName}`} title="Delete" onClick={() => onDelete(e)}>
                <Trash2 />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [onDelete, onSort, sortBy, sortDir]);

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualSorting: true,
    manualPagination: true,
  });

  return (
    <div className={cn("transition-opacity", isRefreshing && "opacity-60")} aria-busy={isRefreshing}>
      <Table aria-label="Employees">
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  aria-sort={
                    header.column.id === sortBy ? (sortDir === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={RESPONSIVE[header.column.id]}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-testid="employee-row">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={RESPONSIVE[cell.column.id]}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function EmployeeTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading employees" className="divide-y divide-border">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5">
          <div className="size-10 animate-pulse rounded-full bg-black/[0.07]" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 animate-pulse rounded bg-black/[0.07]" />
            <div className="h-3 w-56 animate-pulse rounded bg-black/[0.05]" />
          </div>
          <div className="hidden h-3.5 w-28 animate-pulse rounded bg-black/[0.07] md:block" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-black/[0.07]" />
        </div>
      ))}
    </div>
  );
}

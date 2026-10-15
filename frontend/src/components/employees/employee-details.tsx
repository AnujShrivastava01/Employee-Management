"use client";

import { ArrowLeft, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";
import { formatDate, formatRelativeDate, formatSalary } from "@/lib/format";
import { useEmployee } from "@/lib/hooks";
import { DeleteEmployeeDialog } from "./delete-employee-dialog";
import { EmployeeAvatar } from "./employee-avatar";
import { StatusBadge } from "./status-badge";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading employee" className="space-y-6">
      <Skeleton className="h-20 w-full max-w-lg" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function EmployeeDetails({ id }: { id: string }) {
  const router = useRouter();
  const { data: employee, isPending, isError, error, refetch } = useEmployee(id);
  const [confirmDelete, setConfirmDelete] = React.useState<Employee | null>(null);

  if (isPending) return <DetailsSkeleton />;

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Card>
        <ErrorState
          error={error}
          title={notFound ? "Employee not found" : "We couldn't load this employee"}
          onRetry={notFound ? undefined : () => refetch()}
          action={
            <Button asChild variant="secondary">
              <Link href="/employees">
                <ArrowLeft /> Back to employees
              </Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Employees", href: "/employees" }, { label: employee.fullName }]}
        title={
          <span className="flex items-center gap-4">
            <EmployeeAvatar name={employee.fullName} size="lg" />
            <span className="min-w-0">
              <span className="block truncate">{employee.fullName}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-sm font-normal text-muted-foreground">
                <span className="font-mono text-xs">{employee.employeeId}</span>
                <span aria-hidden>·</span>
                <StatusBadge status={employee.status} />
              </span>
            </span>
          </span>
        }
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/employees">
                <ArrowLeft /> Back to list
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/employees/${employee.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <Button variant="danger-ghost" onClick={() => setConfirmDelete(employee)}>
              <Trash2 /> Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Employment</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <dl className="divide-y divide-border">
              <Detail label="Employee ID">{employee.employeeId}</Detail>
              <Detail label="Department">{employee.department.name}</Detail>
              <Detail label="Designation">{employee.designation}</Detail>
              <Detail label="Date of joining">
                {formatDate(employee.dateOfJoining)}
                <span className="ml-2 font-normal text-muted-foreground">({formatRelativeDate(employee.dateOfJoining)})</span>
              </Detail>
              <Detail label="Employment status">
                <StatusBadge status={employee.status} />
              </Detail>
              <Detail label="Annual salary">{formatSalary(employee.salary)}</Detail>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <a href={`mailto:${employee.email}`} className="flex items-center gap-2.5 break-all hover:text-accent hover:underline">
                <Mail aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                {employee.email}
              </a>
              <a href={`tel:${employee.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2.5 hover:text-accent hover:underline">
                <Phone aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                {employee.phone}
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-4 text-sm text-muted-foreground">
              <p>Created {new Date(employee.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
              <p>Updated {new Date(employee.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteEmployeeDialog
        employee={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onDeleted={() => router.replace("/employees")}
      />
    </>
  );
}

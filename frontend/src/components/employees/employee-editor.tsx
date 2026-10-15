"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";
import { emptyEmployeeForm, toEmployeeInput, type EmployeeFormValues } from "@/lib/employee-schema";
import { useCreateEmployee, useDepartments, useEmployee, useUpdateEmployee } from "@/lib/hooks";
import Link from "next/link";
import { EmployeeForm } from "./employee-form";

function toFormValues(employee: Employee): EmployeeFormValues {
  return {
    employeeId: employee.employeeId,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    departmentId: String(employee.department.id),
    designation: employee.designation,
    dateOfJoining: employee.dateOfJoining,
    salary: String(employee.salary),
    status: employee.status,
  };
}

export function CreateEmployee() {
  const router = useRouter();
  const departments = useDepartments();
  const create = useCreateEmployee();

  return (
    <>
      <PageHeader
        title="Add employee"
        description="Create a new record in the employee directory."
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Employees", href: "/employees" }, { label: "Add employee" }]}
      />
      {departments.isError ? (
        <Card>
          <ErrorState error={departments.error} title="We couldn't load departments" onRetry={() => departments.refetch()} />
        </Card>
      ) : (
        <EmployeeForm
          mode="create"
          defaultValues={emptyEmployeeForm}
          departments={departments.data ?? []}
          departmentsLoading={departments.isPending}
          returnHref="/employees"
          onSubmit={async (values) => {
            const created = await create.mutateAsync(toEmployeeInput(values));
            toast.success(`${created.fullName} was added`);
            router.push(`/employees/${created.id}`);
          }}
        />
      )}
    </>
  );
}

export function EditEmployee({ id }: { id: string }) {
  const router = useRouter();
  const departments = useDepartments();
  const employee = useEmployee(id);
  const update = useUpdateEmployee(id);

  if (employee.isPending) {
    return <Skeleton role="status" aria-label="Loading employee" className="h-96 w-full" />;
  }
  if (employee.isError) {
    const notFound = employee.error instanceof ApiError && employee.error.status === 404;
    return (
      <Card>
        <ErrorState
          error={employee.error}
          title={notFound ? "Employee not found" : "We couldn't load this employee"}
          onRetry={notFound ? undefined : () => employee.refetch()}
          action={
            <Button asChild variant="secondary">
              <Link href="/employees">Back to employees</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={`Edit ${employee.data.fullName}`}
        description="Update this employee's details."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Employees", href: "/employees" },
          { label: employee.data.fullName, href: `/employees/${id}` },
          { label: "Edit" },
        ]}
      />
      <EmployeeForm
        mode="edit"
        defaultValues={toFormValues(employee.data)}
        departments={departments.data ?? []}
        departmentsLoading={departments.isPending}
        returnHref={`/employees/${id}`}
        onSubmit={async (values) => {
          const saved = await update.mutateAsync(toEmployeeInput(values));
          toast.success(`${saved.fullName} was updated`);
          router.push(`/employees/${id}`);
        }}
      />
    </>
  );
}

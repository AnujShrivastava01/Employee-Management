"use client";

import { ArrowRight, Building2, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { EmployeeAvatar } from "@/components/employees/employee-avatar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate } from "@/lib/format";
import { useEmployeeStats } from "@/lib/hooks";
import { DepartmentChart } from "./department-chart";
import { StatCard } from "./stat-card";

function percent(part: number, whole: number) {
  return whole === 0 ? "0%" : `${Math.round((part / whole) * 100)}%`;
}

export function Dashboard() {
  const { data, isPending, isError, error, refetch } = useEmployeeStats();

  const actions = (
    <>
      <Button asChild variant="secondary">
        <Link href="/employees">
          <Users /> View employees
        </Link>
      </Button>
      <Button asChild>
        <Link href="/employees/new">
          <UserPlus /> Add employee
        </Link>
      </Button>
    </>
  );

  if (isError && !data) {
    return (
      <>
        <PageHeader title="Dashboard" description="A snapshot of your workforce." actions={actions} />
        <Card>
          <ErrorState error={error} title="We couldn't load the dashboard" onRetry={() => refetch()} />
        </Card>
      </>
    );
  }

  const total = data?.totalEmployees ?? 0;
  const departmentsWithPeople = data?.departmentDistribution.filter((d) => d.count > 0) ?? [];

  return (
    <>
      <PageHeader title="Dashboard" description="A snapshot of your workforce, updated live from the directory." actions={actions} />

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total employees" value={data?.totalEmployees} icon={Users} loading={isPending} hint="Everyone in the directory" />
        <StatCard
          label="Active employees"
          value={data?.activeEmployees}
          icon={UserCheck}
          tone="success"
          loading={isPending}
          hint={data ? `${percent(data.activeEmployees, total)} of workforce` : undefined}
        />
        <StatCard
          label="Inactive employees"
          value={data?.inactiveEmployees}
          icon={UserMinus}
          tone="neutral"
          loading={isPending}
          hint={data ? `${percent(data.inactiveEmployees, total)} of workforce` : undefined}
        />
        <StatCard label="Departments" value={data?.totalDepartments} icon={Building2} loading={isPending} hint="Teams in the organisation" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Employees by department</CardTitle>
              <CardDescription>Headcount across teams</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div role="status" aria-label="Loading chart" className="space-y-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-5" style={{ width: `${90 - i * 12}%` }} />
                ))}
              </div>
            ) : departmentsWithPeople.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No department data yet"
                description="Once employees are added, you'll see how they are distributed across departments."
              />
            ) : (
              <DepartmentChart data={departmentsWithPeople} />
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Recently joined</CardTitle>
              <CardDescription>Latest additions to the team</CardDescription>
            </div>
            <Button asChild variant="link" size="sm" className="px-0">
              <Link href="/employees?sortBy=dateOfJoining&sortDir=desc">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-3">
            {isPending ? (
              <div role="status" aria-label="Loading recent joiners" className="space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.recentlyJoined.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nobody has joined yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data?.recentlyJoined.map((employee) => (
                  <li key={employee.id}>
                    <Link href={`/employees/${employee.id}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-surface-muted">
                      <EmployeeAvatar name={employee.fullName} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{employee.fullName}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {employee.designation} · {employee.department.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeDate(employee.dateOfJoining)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

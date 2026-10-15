"use client";

import { ArrowRight, Building2, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { EmployeeAvatar } from "@/components/employees/employee-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { formatRelativeDate } from "@/lib/format";
import { useEmployeeStats } from "@/lib/hooks";
import { DepartmentChart } from "./department-chart";
import { HiringTrendChart } from "./hiring-trend-chart";
import { StatCard } from "./stat-card";
import { StatusDonut } from "./status-donut";

function percent(part: number, whole: number) {
  return whole === 0 ? "0%" : `${Math.round((part / whole) * 100)}%`;
}

function greeting(now = new Date()) {
  const hour = now.getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function Hero({ name, summary, loading }: { name?: string; summary?: string; loading: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-brand p-6 text-white shadow-lift sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div aria-hidden className="bg-dots absolute inset-0 [mask-image:linear-gradient(120deg,transparent_30%,black)]" />
      {/* the three "people" of the logo, as floating shapes */}
      <div aria-hidden className="animate-float absolute -right-10 -top-12 size-36 rounded-full bg-coral/90 shadow-[0_20px_60px_-10px_rgb(255_122_89/0.6)] sm:right-16 sm:-top-10 sm:size-40" />
      <div aria-hidden className="animate-float-slow absolute right-40 top-24 hidden size-20 rounded-full bg-periwinkle sm:block" />
      <div aria-hidden className="animate-float-slow absolute -bottom-16 right-48 hidden size-44 rounded-full bg-white/90 sm:block" />

      <div className="relative max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">Dashboard</p>
        <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl">
          {greeting()}, <span className="capitalize">{name ?? "there"}</span>
        </h1>
        <div className="mt-2 min-h-6 text-[15px] text-white/75">
          {loading ? <Skeleton className="h-5 w-72 bg-white/20" /> : summary}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/employees/new">
              <UserPlus /> Add employee
            </Link>
          </Button>
          <Button asChild variant="glass" size="lg">
            <Link href="/employees">
              <Users /> View employees
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useEmployeeStats();

  if (isError && !data) {
    return (
      <>
        <Hero name={user?.username} loading={false} summary="A snapshot of your workforce." />
        <Card className="mt-6">
          <ErrorState error={error} title="We couldn't load the dashboard" onRetry={() => refetch()} />
        </Card>
      </>
    );
  }

  const total = data?.totalEmployees ?? 0;
  const departmentsWithPeople = data?.departmentDistribution.filter((d) => d.count > 0) ?? [];
  const summary = data
    ? `${data.totalEmployees} ${data.totalEmployees === 1 ? "person" : "people"} across ${data.totalDepartments} ${data.totalDepartments === 1 ? "department" : "departments"} · ${data.activeEmployees} active today`
    : undefined;

  return (
    <div className="space-y-6">
      <Hero name={user?.username} summary={summary} loading={isPending} />

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total employees" value={data?.totalEmployees} icon={Users} tone="accent" loading={isPending} hint="Everyone in the directory" delay={0} />
        <StatCard
          label="Active employees"
          value={data?.activeEmployees}
          icon={UserCheck}
          tone="success"
          loading={isPending}
          hint={data ? `${percent(data.activeEmployees, total)} of workforce` : undefined}
          delay={70}
        />
        <StatCard
          label="Inactive employees"
          value={data?.inactiveEmployees}
          icon={UserMinus}
          tone="coral"
          loading={isPending}
          hint={data ? `${percent(data.inactiveEmployees, total)} of workforce` : undefined}
          delay={140}
        />
        <StatCard label="Departments" value={data?.totalDepartments} icon={Building2} tone="navy" loading={isPending} hint="Teams in the organisation" delay={210} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Hiring trend</CardTitle>
              <CardDescription>New joiners per month, last 12 months</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isPending ? <Skeleton role="status" aria-label="Loading trend" className="h-64" /> : <HiringTrendChart data={data?.hiringTrend ?? []} />}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle>Workforce status</CardTitle>
              <CardDescription>Active versus inactive</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center pt-4">
            {isPending ? (
              <Skeleton role="status" aria-label="Loading status chart" className="size-52 rounded-full" />
            ) : (
              <StatusDonut active={data?.activeEmployees ?? 0} inactive={data?.inactiveEmployees ?? 0} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
              <ul className="space-y-1">
                {data?.recentlyJoined.map((employee) => (
                  <li key={employee.id}>
                    <Link
                      href={`/employees/${employee.id}`}
                      prefetch={false}
                      className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-accent-soft/60"
                    >
                      <EmployeeAvatar name={employee.fullName} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{employee.fullName}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {employee.designation} · {employee.department.name}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-medium text-[#c2441f]">
                        {formatRelativeDate(employee.dateOfJoining)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

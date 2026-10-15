"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import type { Department } from "@/lib/api/types";
import { employeeFormSchema, type EmployeeFormValues } from "@/lib/employee-schema";
import { errorMessage } from "@/components/common/error-state";

interface EmployeeFormProps {
  mode: "create" | "edit";
  defaultValues: EmployeeFormValues;
  departments: Department[];
  departmentsLoading?: boolean;
  /** Where Cancel / Back return to. */
  returnHref: string;
  /** Resolve on success. Reject with an ApiError to surface server-side validation on the fields. */
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}

const FORM_FIELDS = Object.keys(employeeFormSchema.shape) as (keyof EmployeeFormValues)[];

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-b border-border py-6 first:pt-0 last:border-0 last:pb-0 lg:grid-cols-[14rem_1fr] lg:gap-10">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function EmployeeForm({ mode, defaultValues, departments, departmentsLoading, returnHref, onSubmit }: EmployeeFormProps) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const submitted = React.useRef(false);
  const inFlight = React.useRef(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { register, handleSubmit, setError, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;

  // Warn before a reload / tab close would throw away typed data.
  React.useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirty && !submitted.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const leave = () => {
    if (isDirty && !submitted.current) setConfirmLeave(true);
    else router.push(returnHref);
  };

  const submit = handleSubmit(async (values) => {
    // The button disables itself after a re-render, but a fast double-click can slip in before that.
    if (inFlight.current) return;
    inFlight.current = true;
    setFormError(null);
    try {
      await onSubmit(values);
      submitted.current = true;
    } catch (error) {
      inFlight.current = false; // only a failed save may be retried; a successful one navigates away
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        let mapped = 0;
        for (const detail of error.fieldErrors) {
          if ((FORM_FIELDS as string[]).includes(detail.field)) {
            setError(detail.field as keyof EmployeeFormValues, { type: "server", message: detail.message }, { shouldFocus: mapped === 0 });
            mapped++;
          }
        }
        if (mapped === 0) setFormError(error.message);
        else setFormError("Please fix the highlighted fields and save again.");
      } else {
        setFormError(errorMessage(error));
      }
    }
  });

  const noDepartments = !departmentsLoading && departments.length === 0;
  const control = (id: keyof EmployeeFormValues) => ({
    id,
    ...register(id),
  });

  return (
    <form onSubmit={submit} noValidate aria-label={mode === "create" ? "Add employee" : "Edit employee"}>
      <Card>
        <CardContent className="p-6">
          {formError && (
            <p role="alert" className="mb-6 rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {formError}
            </p>
          )}

          <Section title="Identity" description="How this person is identified and contacted.">
            <Field id="employeeId" label="Employee ID" required error={errors.employeeId?.message} hint="Unique, e.g. EMP-1037">
              {(aria) => <Input {...aria} {...control("employeeId")} placeholder="EMP-1037" autoComplete="off" maxLength={30} />}
            </Field>
            <Field id="fullName" label="Full name" required error={errors.fullName?.message}>
              {(aria) => <Input {...aria} {...control("fullName")} placeholder="Ananya Iyer" autoComplete="off" maxLength={120} />}
            </Field>
            <Field id="email" label="Email address" required error={errors.email?.message}>
              {(aria) => <Input {...aria} {...control("email")} type="email" placeholder="ananya.iyer@company.com" autoComplete="off" maxLength={254} />}
            </Field>
            <Field id="phone" label="Phone number" required error={errors.phone?.message}>
              {(aria) => <Input {...aria} {...control("phone")} type="tel" placeholder="+91 98765 43210" autoComplete="off" maxLength={20} />}
            </Field>
          </Section>

          <Section title="Employment" description="Where this person works and their current standing.">
            <Field id="departmentId" label="Department" required error={errors.departmentId?.message}>
              {(aria) => (
                <Select {...aria} {...control("departmentId")} disabled={departmentsLoading}>
                  <option value="">{departmentsLoading ? "Loading departments…" : "Select a department"}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={String(department.id)}>
                      {department.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {noDepartments && (
              <p className="-mt-3 text-xs text-warning sm:col-span-2 sm:-mt-2">
                No departments exist yet.{" "}
                <Link href="/departments" className="font-medium underline">
                  Create a department
                </Link>{" "}
                first.
              </p>
            )}
            <Field id="designation" label="Designation" required error={errors.designation?.message}>
              {(aria) => <Input {...aria} {...control("designation")} placeholder="Senior Software Engineer" autoComplete="off" maxLength={100} />}
            </Field>
            <Field id="dateOfJoining" label="Date of joining" required error={errors.dateOfJoining?.message}>
              {(aria) => <Input {...aria} {...control("dateOfJoining")} type="date" min="1980-01-01" />}
            </Field>
            <Field id="status" label="Employment status" required error={errors.status?.message}>
              {(aria) => (
                <Select {...aria} {...control("status")}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              )}
            </Field>
          </Section>

          <Section title="Compensation" description="Annual gross salary in Indian rupees.">
            <Field id="salary" label="Annual salary (₹)" required error={errors.salary?.message} hint="Up to 2 decimal places">
              {(aria) => <Input {...aria} {...control("salary")} inputMode="decimal" placeholder="1850000" autoComplete="off" />}
            </Field>
          </Section>
        </CardContent>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface-muted px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={leave} className="justify-start">
            <ArrowLeft /> Back
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="secondary" onClick={leave}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (mode === "edit" && !isDirty)}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
              {isSubmitting ? "Saving…" : mode === "create" ? "Create employee" : "Save changes"}
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>You have edits that haven&apos;t been saved. If you leave now they will be lost.</AlertDialogDescription>
          <DialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button
              variant="danger"
              onClick={() => {
                submitted.current = true;
                router.push(returnHref);
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

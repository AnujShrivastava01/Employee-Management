"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState, errorMessage } from "@/components/common/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import type { Department } from "@/lib/api/types";
import { departmentFormSchema, type DepartmentFormValues } from "@/lib/department-schema";
import { useDeleteDepartment, useDepartments, useSaveDepartment } from "@/lib/hooks";

function DepartmentDialog({ department, open, onOpenChange }: { department: Department | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const save = useSaveDepartment();
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: { name: "", description: "" },
  });
  const { register, handleSubmit, reset, setError, formState } = form;
  const { errors } = formState;
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      reset({ name: department?.name ?? "", description: department?.description ?? "" });
      setFormError(null);
    }
  }, [open, department, reset]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await save.mutateAsync({ id: department?.id, input: { name: values.name, description: values.description || null } });
      toast.success(department ? "Department updated" : "Department created");
      onOpenChange(false);
    } catch (error) {
      const nameError = error instanceof ApiError ? error.fieldErrors.find((e) => e.field === "name") : undefined;
      if (nameError) setError("name", { type: "server", message: nameError.message }, { shouldFocus: true });
      else setFormError(errorMessage(error));
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
      <DialogContent>
        <DialogTitle>{department ? "Edit department" : "New department"}</DialogTitle>
        <DialogDescription>{department ? "Rename the department or update its description." : "Departments group employees and appear in filters."}</DialogDescription>
        <form onSubmit={submit} noValidate className="grid gap-4">
          {formError && (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <Field id="dept-name" label="Name" required error={errors.name?.message}>
            {(aria) => <Input {...aria} {...register("name")} placeholder="Engineering" autoComplete="off" maxLength={100} />}
          </Field>
          <Field id="dept-description" label="Description" error={errors.description?.message} hint="Optional">
            {(aria) => <Textarea {...aria} {...register("description")} rows={3} maxLength={500} />}
          </Field>
          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {department ? "Save changes" : "Create department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDepartmentDialog({ department, onClose }: { department: Department | null; onClose: () => void }) {
  const remove = useDeleteDepartment();
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => setError(null), [department]);

  const confirm = async () => {
    if (!department) return;
    try {
      await remove.mutateAsync(department.id);
      toast.success(`${department.name} was deleted`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const blocked = (department?.employeeCount ?? 0) > 0;
  return (
    <AlertDialog open={department !== null} onOpenChange={(open) => !open && !remove.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete {department?.name}?</AlertDialogTitle>
        <AlertDialogDescription>
          {blocked
            ? `${department?.name} still has ${department?.employeeCount} employee${department?.employeeCount === 1 ? "" : "s"}. Reassign them to another department before deleting it.`
            : "This department has no employees and will be permanently removed."}
        </AlertDialogDescription>
        {error && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <DialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>{blocked ? "Close" : "Cancel"}</AlertDialogCancel>
          {!blocked && (
            <Button variant="danger" onClick={confirm} disabled={remove.isPending}>
              {remove.isPending && <Loader2 className="animate-spin" />}
              Delete department
            </Button>
          )}
        </DialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DepartmentManager() {
  const { data, isPending, isError, error, refetch } = useDepartments();
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Department | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Departments"
        description="Organise employees into teams. Departments with employees cannot be deleted."
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Departments" }]}
        actions={
          <Button onClick={openCreate}>
            <Plus /> New department
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isPending ? (
          <div role="status" aria-label="Loading departments" className="space-y-3 p-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} title="We couldn't load departments" onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Create your first department so you can assign employees to it."
            action={
              <Button onClick={openCreate}>
                <Plus /> New department
              </Button>
            }
          />
        ) : (
          <Table aria-label="Departments">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Description</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#7b8af0] to-[#3b4bd0] text-xs font-bold text-white shadow-sm">
                        {department.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-semibold">{department.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-md truncate text-muted-foreground sm:table-cell">{department.description ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {department.employeeCount > 0 ? (
                      <Link href={`/employees?department=${encodeURIComponent(department.name)}`} className="text-accent hover:underline">
                        {department.employeeCount}
                      </Link>
                    ) : (
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${department.name}`}
                        title="Edit"
                        onClick={() => {
                          setEditing(department);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button variant="danger-ghost" size="icon" aria-label={`Delete ${department.name}`} title="Delete" onClick={() => setDeleting(department)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <DepartmentDialog department={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
      <DeleteDepartmentDialog department={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

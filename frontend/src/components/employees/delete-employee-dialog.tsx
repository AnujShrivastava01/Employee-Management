"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { errorMessage } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import type { Employee } from "@/lib/api/types";
import { useDeleteEmployee } from "@/lib/hooks";

interface DeleteEmployeeDialogProps {
  employee: Employee | null;
  onClose: () => void;
  onDeleted?: (employee: Employee) => void;
}

export function DeleteEmployeeDialog({ employee, onClose, onDeleted }: DeleteEmployeeDialogProps) {
  const mutation = useDeleteEmployee();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setError(null);
  }, [employee]);

  const confirm = async () => {
    if (!employee) return;
    try {
      await mutation.mutateAsync(employee.id);
      toast.success(`${employee.fullName} was deleted`);
      onDeleted?.(employee);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Somebody else already removed it; the list will refresh without it.
        toast.info(`${employee.fullName} no longer exists`);
        onDeleted?.(employee);
        onClose();
        return;
      }
      setError(errorMessage(err));
    }
  };

  return (
    <AlertDialog open={employee !== null} onOpenChange={(open) => !open && !mutation.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete {employee?.fullName}?</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently removes {employee?.fullName} ({employee?.employeeId}) from the directory. This action cannot be undone.
        </AlertDialogDescription>
        {error && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <DialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <Button variant="danger" onClick={confirm} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />}
            Delete employee
          </Button>
        </DialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

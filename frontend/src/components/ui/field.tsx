import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => React.ReactNode;
}

/** Label + control + hint/error wiring so every form field is announced correctly. */
export function Field({ id, label, required, hint, error, className, children }: FieldProps) {
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-danger">
            *
          </span>
        )}
      </Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": messageId })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

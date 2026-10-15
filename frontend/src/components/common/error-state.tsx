import { AlertTriangle, RotateCw } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function ErrorState({ error, title = "Something went wrong", onRetry, action }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger ring-1 ring-inset ring-danger/10">
        <AlertTriangle aria-hidden className="size-6" />
      </span>
      <h3 className="font-display text-base font-semibold text-navy">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{errorMessage(error)}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCw /> Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

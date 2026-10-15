import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldControlClasses =
  "w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring/30 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:outline-danger/25";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldControlClasses, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldControlClasses, "min-h-20 py-2", className)} {...props} />;
}

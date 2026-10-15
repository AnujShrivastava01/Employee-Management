import { ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldControlClasses } from "./input";

/** Styled native select: accessible, mobile friendly and keyboard complete out of the box. */
export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        data-slot="select"
        className={cn(fieldControlClasses, "h-9 cursor-pointer appearance-none pr-9")}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

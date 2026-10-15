import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      success: "bg-success-soft text-success ring-1 ring-inset ring-success/15",
      neutral: "bg-[#eef0f7] text-muted-foreground ring-1 ring-inset ring-black/5",
      accent: "bg-accent-soft text-accent ring-1 ring-inset ring-accent/15",
      danger: "bg-danger-soft text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

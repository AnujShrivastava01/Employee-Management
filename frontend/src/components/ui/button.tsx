import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-brand-button text-accent-foreground shadow-glow hover:brightness-110 hover:shadow-[0_10px_26px_-6px_rgb(49_64_196/0.7)]",
        accent: "bg-coral text-white shadow-[0_8px_20px_-6px_rgb(255_122_89/0.75)] hover:bg-coral-hover",
        glass: "border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20",
        secondary: "border border-border-strong bg-surface text-foreground shadow-sm hover:border-periwinkle/60 hover:bg-accent-soft/60",
        ghost: "text-muted-foreground hover:bg-accent-soft hover:text-accent",
        danger: "bg-danger text-white shadow-sm hover:bg-[#912018]",
        "danger-ghost": "text-muted-foreground hover:bg-danger-soft hover:text-danger",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-4",
        lg: "h-11 px-5 text-[15px]",
        icon: "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };

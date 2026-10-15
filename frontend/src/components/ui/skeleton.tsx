import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden data-slot="skeleton" className={cn("animate-pulse rounded-md bg-[#e6e9f7]", className)} {...props} />;
}

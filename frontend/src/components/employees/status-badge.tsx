import { Badge } from "@/components/ui/badge";
import type { EmploymentStatus } from "@/lib/api/types";
import { statusLabel } from "@/lib/format";

export function StatusBadge({ status }: { status: EmploymentStatus }) {
  const active = status === "ACTIVE";
  return (
    <Badge tone={active ? "success" : "neutral"}>
      <span aria-hidden className={`size-1.5 rounded-full ${active ? "bg-success shadow-[0_0_0_3px_rgb(6_118_71/0.18)]" : "bg-muted-foreground/50"}`} />
      {statusLabel(status)}
    </Badge>
  );
}

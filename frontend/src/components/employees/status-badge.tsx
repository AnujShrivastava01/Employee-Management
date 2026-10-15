import { Badge } from "@/components/ui/badge";
import type { EmploymentStatus } from "@/lib/api/types";
import { statusLabel } from "@/lib/format";

export function StatusBadge({ status }: { status: EmploymentStatus }) {
  const active = status === "ACTIVE";
  return (
    <Badge tone={active ? "success" : "neutral"}>
      <span aria-hidden className={`size-1.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground/60"}`} />
      {statusLabel(status)}
    </Badge>
  );
}

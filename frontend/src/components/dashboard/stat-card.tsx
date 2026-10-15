import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value?: number;
  hint?: string;
  icon: LucideIcon;
  tone?: "accent" | "success" | "neutral";
  loading?: boolean;
}

const TONES = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  neutral: "bg-black/5 text-muted-foreground",
} as const;

export function StatCard({ label, value, hint, icon: Icon, tone = "accent", loading }: StatCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
              {value?.toLocaleString("en-IN") ?? "—"}
            </p>
          )}
          {hint && !loading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", TONES[tone])}>
          <Icon aria-hidden className="size-[18px]" />
        </span>
      </div>
    </Card>
  );
}

import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value?: number;
  hint?: string;
  icon: LucideIcon;
  tone?: "accent" | "success" | "coral" | "navy";
  loading?: boolean;
  /** Delay (ms) for the staggered entrance animation. */
  delay?: number;
}

const TONES = {
  accent: { chip: "from-[#7b8af0] to-[#3b4bd0]", glow: "bg-periwinkle/25" },
  success: { chip: "from-[#34d399] to-[#059669]", glow: "bg-emerald-400/20" },
  coral: { chip: "from-[#ffa088] to-[#ff6a45]", glow: "bg-coral/25" },
  navy: { chip: "from-[#3b4bd0] to-[#1f2a7a]", glow: "bg-navy/15" },
} as const;

export function StatCard({ label, value, hint, icon: Icon, tone = "accent", loading, delay = 0 }: StatCardProps) {
  const styles = TONES[tone];
  return (
    <div
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
      className="group relative overflow-hidden rounded-xl border border-border/80 bg-surface p-4 ring-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift animate-in fade-in slide-in-from-bottom-3 duration-500 sm:p-5"
    >
      <div aria-hidden className={cn("absolute -right-6 -top-6 size-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100", styles.glow)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-16" />
          ) : (
            <p
              className="mt-1 font-display text-4xl font-bold tabular-nums tracking-tight text-navy"
              data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {value?.toLocaleString("en-IN") ?? "—"}
            </p>
          )}
          {hint && !loading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", styles.chip)}>
          <Icon aria-hidden className="size-5" />
        </span>
      </div>
    </div>
  );
}

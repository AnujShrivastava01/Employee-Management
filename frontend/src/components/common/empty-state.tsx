import type { LucideIcon } from "lucide-react";
import * as React from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="relative mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-accent-soft to-white text-accent shadow-card ring-1 ring-inset ring-accent/10">
        <span aria-hidden className="absolute -right-1 -top-1 size-3 rounded-full bg-coral" />
        <Icon aria-hidden className="size-6" />
      </span>
      <h3 className="font-display text-base font-semibold text-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

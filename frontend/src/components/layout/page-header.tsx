import { ChevronRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="rounded-sm transition-colors hover:text-accent hover:underline">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-foreground">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-navy sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

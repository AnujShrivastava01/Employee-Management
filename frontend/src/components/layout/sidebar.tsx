"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-5">
        <Link href="/" onClick={onNavigate} aria-label="Rosterly home">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Main" className="flex-1 space-y-0.5 px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-accent-soft text-accent" : "text-muted-foreground hover:bg-black/5 hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-[18px]", active ? "text-accent" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <a
          href="/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
        >
          <BookOpen className="size-[18px]" />
          API documentation
        </a>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">
      <SidebarContent />
    </aside>
  );
}

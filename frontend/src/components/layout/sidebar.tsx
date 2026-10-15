"use client";

import { BookOpen, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const signOut = async () => {
    try {
      await logout();
    } catch {
      toast.error("Could not sign out cleanly. Your session was cleared locally.");
    }
    router.replace("/login");
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sidebar text-white">
      {/* decorative shapes taken from the logo */}
      <div aria-hidden className="pointer-events-none absolute -right-16 top-40 size-48 rounded-full bg-periwinkle/15 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -left-10 bottom-32 size-40 rounded-full bg-coral/10 blur-2xl" />

      <div className="relative flex h-16 items-center px-5">
        <Link href="/" onClick={onNavigate} aria-label="Rosterly home" className="rounded-lg">
          <Logo tone="light" />
        </Link>
      </div>

      <p className="relative px-6 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Workspace</p>
      <nav aria-label="Main" className="relative flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
                  : "text-white/65 hover:bg-white/[0.07] hover:text-white",
              )}
            >
              {active && <span aria-hidden className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-coral shadow-[0_0_12px_rgb(255_122_89/0.9)]" />}
              <item.icon className={cn("size-[18px] transition-colors", active ? "text-coral" : "text-white/50 group-hover:text-white/90")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative space-y-1 border-t border-white/10 p-3">
        <a
          href="/swagger-ui/index.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <BookOpen className="size-[18px] text-white/50" />
          API documentation
        </a>
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.08] p-3 ring-1 ring-inset ring-white/10">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-coral text-xs font-bold text-white shadow-md">
            {initials(user?.username ?? "?")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{user?.username ?? "—"}</span>
            <span className="block truncate text-xs capitalize text-white/55">{user?.role.toLowerCase() ?? ""}</span>
          </span>
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className="grid size-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/15 hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 shadow-[4px_0_24px_-8px_rgb(16_22_74/0.4)] lg:block">
      <SidebarContent />
    </aside>
  );
}

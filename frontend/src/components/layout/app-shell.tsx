"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/lib/auth";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useRequireAuth();
  const pathname = usePathname();

  if (!user) {
    // Either the session check is still running or we are redirecting to /login.
    return (
      <div role="status" aria-label="Loading" className="bg-app grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-5">
          <Logo size="lg" />
          <Skeleton className="h-1.5 w-36 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {/* keyed by route so every page fades/slides in */}
          <div key={pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

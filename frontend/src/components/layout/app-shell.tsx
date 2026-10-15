"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/lib/auth";
import { Logo } from "./logo";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useRequireAuth();

  if (!user) {
    // Either the session check is still running or we are redirecting to /login.
    return (
      <div role="status" aria-label="Loading" className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <Skeleton className="h-1.5 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

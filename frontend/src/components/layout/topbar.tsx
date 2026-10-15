"use client";

import { ChevronDown, LogOut, Menu, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";
import { SidebarContent } from "./sidebar";

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/employees?search=${encodeURIComponent(term)}` : "/employees");
  };

  const signOut = async () => {
    try {
      await logout();
    } catch {
      toast.error("Could not sign out cleanly. Your session was cleared locally.");
    }
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>
        <Menu />
      </Button>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="left-0 top-0 h-full max-w-72 translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0 data-[state=open]:slide-in-from-left"
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <DialogDescription className="sr-only">Main navigation links</DialogDescription>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </DialogContent>
      </Dialog>

      <form role="search" onSubmit={submitSearch} className="relative hidden w-full max-w-sm sm:block">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Quick search"
          placeholder="Quick search employees…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="bg-surface-muted pl-9 shadow-none"
        />
      </form>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-black/5"
            >
              <span className="grid size-7 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {initials(user?.username ?? "?")}
              </span>
              <span className="hidden text-sm font-medium sm:inline">{user?.username}</span>
              <ChevronDown aria-hidden className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role.toLowerCase()}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={signOut}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

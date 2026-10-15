"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { authApi } from "./api/auth";
import { setUnauthorizedHandler } from "./api/client";
import type { CurrentUser } from "./api/types";

const ME_KEY = ["me"] as const;

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 5 * 60_000,
    retry: false,
  });

  // A 401 from any API call means the session expired: forget the user so the guard redirects to login.
  React.useEffect(() => {
    setUnauthorizedHandler(() => client.setQueryData(ME_KEY, null));
    return () => setUnauthorizedHandler(null);
  }, [client]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading,
      login: async (username, password) => {
        const user = await authApi.login(username, password);
        client.clear();
        client.setQueryData(ME_KEY, user);
        return user;
      },
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          client.clear();
          client.setQueryData(ME_KEY, null);
        }
      },
    }),
    [client, data, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

/** Only same-site relative paths are accepted as post-login destinations (prevents open redirects). */
export function safeRedirectPath(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}

/** Redirects anonymous visitors to /login, remembering where they wanted to go. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  React.useEffect(() => {
    if (!auth.isLoading && auth.user === null) {
      const target = search ? `${pathname}?${search}` : pathname;
      router.replace(`/login?next=${encodeURIComponent(target)}`);
    }
  }, [auth.isLoading, auth.user, pathname, router, search]);

  return auth;
}

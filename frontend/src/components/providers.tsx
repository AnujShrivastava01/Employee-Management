"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        // 4xx responses will not change on retry; transient failures get two quick retries.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(makeQueryClient);
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster position="top-right" richColors closeButton toastOptions={{ classNames: { toast: "font-sans" } }} />
    </QueryClientProvider>
  );
}

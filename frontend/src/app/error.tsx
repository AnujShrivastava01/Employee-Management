"use client";

import { ErrorState } from "@/components/common/error-state";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <ErrorState error={error} title="Something went wrong" onRetry={reset} />
    </main>
  );
}

"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";

/**
 * Create / join / pick funnel. AppShell shows WorkspaceEntry until
 * the user is in a space; then we send them into the app.
 */
function EnterInner() {
  const router = useRouter();

  return (
    <AppShell showFilter={false}>
      {() => {
        router.replace("/capture");
        return (
          <p className="text-sm text-ink-muted text-center py-12">
            Opening your space…
          </p>
        );
      }}
    </AppShell>
  );
}

export function EnterClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface text-ink flex items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <EnterInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";

/**
 * Create / join funnel. AppShell shows WorkspaceEntry until the user
 * has a membership; once they do, send them to Home.
 */
function EnterInner() {
  return (
    <AppShell showFilter={false}>
      {({ workspaceId, me }) => (
        <EnterRedirect ready={!!workspaceId && !!me} />
      )}
    </AppShell>
  );
}

function EnterRedirect({ ready }: { ready: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (ready) router.replace("/home");
  }, [ready, router]);

  return (
    <p className="text-sm text-ink-muted text-center py-12">
      Opening your space…
    </p>
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

import { Suspense } from "react";
import { CaptureClient } from "./CaptureClient";

export default function CapturePageRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface text-ink flex items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <CaptureClient />
    </Suspense>
  );
}

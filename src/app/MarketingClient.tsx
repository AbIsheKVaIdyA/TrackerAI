"use client";

import { Suspense, useEffect, useState } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductLanding } from "@/components/ProductLanding";

function MarketingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const code = params.get("code");
    if (code) {
      router.replace(`/enter?code=${encodeURIComponent(code)}`);
      return;
    }
    if (!isLoaded) return;

    // Signed-in users never stay on marketing — go into the app.
    if (isSignedIn) {
      router.replace("/home");
      return;
    }

    setReady(true);
  }, [params, router, isLoaded, isSignedIn]);

  if (!ready || !isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-[#040404] text-ink flex items-center justify-center text-sm text-ink-muted">
        {isSignedIn ? "Opening your space…" : "Loading…"}
      </div>
    );
  }

  return (
    <ProductLanding
      headerActions={
        <div className="flex items-center gap-2">
          <SignInButton mode="redirect" forceRedirectUrl="/home">
            <button
              type="button"
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="redirect" forceRedirectUrl="/home">
            <button
              type="button"
              className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-accent/50"
            >
              Sign up
            </button>
          </SignUpButton>
        </div>
      }
      onCreate={() => router.push("/sign-up")}
      onJoin={() => router.push("/sign-in")}
    />
  );
}

export function MarketingClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#040404] text-ink flex items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <MarketingInner />
    </Suspense>
  );
}

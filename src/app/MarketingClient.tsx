"use client";

import { Suspense, useEffect, useState } from "react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  useAuth,
} from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductLanding } from "@/components/ProductLanding";

function MarketingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [hasSpace, setHasSpace] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const code = params.get("code");
    if (code) {
      router.replace(`/enter?code=${encodeURIComponent(code)}`);
      return;
    }
    if (!isLoaded) return;

    if (!isSignedIn) {
      setHasSpace(false);
      setReady(true);
      return;
    }

    void fetch("/api/workspace/me")
      .then((r) => r.json())
      .then((data) => {
        setHasSpace(!!data.membership);
        setReady(true);
      })
      .catch(() => {
        setHasSpace(false);
        setReady(true);
      });
  }, [params, router, isLoaded, isSignedIn]);

  if (!ready || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#040404] text-ink flex items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <ProductLanding
      headerActions={
        <SignedOut>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button
                type="button"
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-accent/50"
              >
                Sign up
              </button>
            </SignUpButton>
          </div>
        </SignedOut>
      }
      onCreate={() => {
        if (!isSignedIn) {
          router.push("/sign-up");
          return;
        }
        router.push("/enter?step=create");
      }}
      onJoin={() => {
        if (!isSignedIn) {
          router.push("/sign-in");
          return;
        }
        router.push("/enter?step=join");
      }}
      onContinue={
        isSignedIn && hasSpace ? () => router.push("/home") : undefined
      }
      continueLabel="Open your space"
      signedInHint={
        <SignedIn>
          <p className="mt-3 text-xs text-ink-dim">
            Signed in. Create a space or join with a code.
          </p>
        </SignedIn>
      }
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

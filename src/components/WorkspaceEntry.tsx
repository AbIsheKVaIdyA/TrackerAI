"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CoupleSettings, Workspace } from "@/lib/types";

type Step = "landing" | "create" | "join" | "created";

interface Props {
  settings: CoupleSettings;
  workspace: Workspace | null;
  meName?: string | null;
  needsMigration?: boolean;
  initialCode?: string;
  onCreate: (input: {
    name: string;
    partnerAName: string;
    partnerBName: string;
  }) => Promise<Workspace>;
  onJoin: (code: string) => Promise<Workspace>;
  onEnter: () => void;
  onLeave: () => void;
}

export function WorkspaceEntry({
  workspace,
  needsMigration,
  initialCode,
  onCreate,
  onJoin,
  onEnter,
  onLeave,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onEnterRoute = pathname.startsWith("/enter");

  function backToMarketing() {
    if (onEnterRoute) {
      router.push("/");
      return;
    }
    setStep("landing");
  }

  const codeFromUrl = useMemo(
    () => initialCode ?? searchParams.get("code") ?? "",
    [initialCode, searchParams]
  );
  const stepFromUrl = searchParams.get("step");

  const [step, setStep] = useState<Step>(() => {
    if (workspace) return "created";
    if (codeFromUrl) return "join";
    if (stepFromUrl === "create" || stepFromUrl === "join") return stepFromUrl;
    return "landing";
  });
  const [name, setName] = useState("");
  const [myName, setMyName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [joinCode, setJoinCode] = useState(codeFromUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Workspace | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (workspace && step === "landing") {
      router.replace("/home");
    }
  }, [workspace, step, router]);

  useEffect(() => {
    if (codeFromUrl) {
      setJoinCode(codeFromUrl);
      if (!workspace) setStep("join");
    } else if (
      !workspace &&
      (stepFromUrl === "create" || stepFromUrl === "join")
    ) {
      setStep(stepFromUrl);
    }
  }, [codeFromUrl, workspace, stepFromUrl]);

  useEffect(() => {
    if (onEnterRoute && step === "landing" && !workspace) {
      router.replace("/");
    }
  }, [onEnterRoute, step, workspace, router]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const ws = await onCreate({
        name,
        partnerAName: myName,
        partnerBName: partnerName,
      });
      setCreated(ws);
      setStep("created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onJoin(joinCode);
      onEnter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setBusy(false);
    }
  }

  const activeWorkspace = created ?? workspace;
  const inviteLink =
    typeof window !== "undefined" && activeWorkspace
      ? `${window.location.origin}/enter?code=${activeWorkspace.inviteCode}`
      : "";

  if (step === "landing") {
    return (
      <div className="min-h-screen bg-surface text-ink flex items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen min-h-dvh overflow-hidden bg-surface text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(143,168,184,0.18),transparent_55%)]" />
        <div className="absolute -left-1/4 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent/[0.07] blur-3xl animate-drift" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen min-h-dvh max-w-md flex-col justify-center px-6 py-12">
        <div className="text-center mb-8">
          <p className="font-display text-3xl tracking-[-0.03em] text-ink">
            Tandem
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {step === "create" && "Create your shared space"}
            {step === "join" && "Enter the invite code"}
            {step === "created" && "Invite your person"}
          </p>
        </div>

        {needsMigration && (
          <div className="mb-4 border border-critical/50 bg-critical-dim px-3 py-2.5 text-sm rounded-xl">
            <p className="font-medium text-critical">Database update required</p>
            <p className="mt-1 text-xs text-ink-muted">
              Run{" "}
              <code className="font-mono text-critical">
                supabase/migrate-auth.sql
              </code>{" "}
              in Supabase, then refresh.
            </p>
          </div>
        )}

        {step === "create" && (
          <form onSubmit={handleCreate} className="space-y-4 animate-sheet-in">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-ink-dim">
                Space name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ours"
                className="mt-1 w-full rounded-xl border border-line bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-accent placeholder:text-ink-dim/50"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-ink-dim">
                  Your name
                </span>
                <input
                  required
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1 w-full rounded-xl border border-line bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-accent placeholder:text-ink-dim/50"
                />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-ink-dim">
                  Partner&apos;s name
                </span>
                <input
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Their name"
                  className="mt-1 w-full rounded-xl border border-line bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-accent placeholder:text-ink-dim/50"
                />
              </label>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-surface disabled:opacity-40"
            >
              {busy ? "Creating…" : "Create space"}
            </button>
            <button
              type="button"
              onClick={backToMarketing}
              className="w-full text-sm text-ink-dim"
            >
              Back
            </button>
          </form>
        )}

        {step === "join" && (
          <form onSubmit={handleJoin} className="space-y-4 animate-sheet-in">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-ink-dim">
                Invite code
              </span>
              <input
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD34"
                className="mt-1 w-full rounded-xl border border-line bg-surface-elevated px-3 py-2.5 text-sm tracking-widest uppercase outline-none focus:border-accent"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-surface disabled:opacity-40"
            >
              {busy ? "Joining…" : "Join space"}
            </button>
            <button
              type="button"
              onClick={backToMarketing}
              className="w-full text-sm text-ink-dim"
            >
              Back
            </button>
          </form>
        )}

        {step === "created" && activeWorkspace && (
          <div className="space-y-4 text-center animate-sheet-in">
            <p className="text-sm text-ink-muted">
              Space ready. Share this code with your partner. They sign in and
              join:
            </p>
            <p className="font-display text-3xl tracking-[0.2em] text-accent-strong">
              {activeWorkspace.inviteCode}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  await navigator.clipboard.writeText(
                    activeWorkspace.inviteCode
                  );
                  setCopied(true);
                }
              }}
              className="w-full rounded-full border border-line py-3 text-sm text-ink"
            >
              {copied ? "Copied" : "Copy invite link"}
            </button>
            <button
              type="button"
              onClick={() => onEnter()}
              className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-surface"
            >
              Enter your space
            </button>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                void onLeave();
                if (onEnterRoute) router.push("/");
                else setStep("landing");
              }}
              className="w-full text-center text-xs text-ink-dim"
            >
              Leave and start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

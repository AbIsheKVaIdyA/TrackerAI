"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CoupleSettings, Workspace } from "@/lib/types";

type Step = "choose" | "solo" | "couple" | "join" | "invite";

interface Props {
  settings: CoupleSettings;
  workspace: Workspace | null;
  meName?: string | null;
  needsMigration?: boolean;
  initialCode?: string;
  onCreate: (input: {
    mode: "solo" | "couple";
    name?: string;
    partnerAName?: string;
    partnerBName?: string;
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
  const { user } = useUser();
  const onEnterRoute = pathname.startsWith("/enter");

  const codeFromUrl = useMemo(
    () => initialCode ?? searchParams.get("code") ?? "",
    [initialCode, searchParams]
  );
  const stepFromUrl = searchParams.get("step");

  const [step, setStep] = useState<Step>(() => {
    if (codeFromUrl) return "join";
    if (stepFromUrl === "create" || stepFromUrl === "couple") return "couple";
    if (stepFromUrl === "solo") return "solo";
    if (stepFromUrl === "join") return "join";
    return "choose";
  });
  const [name, setName] = useState("");
  const [myName, setMyName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [joinCode, setJoinCode] = useState(codeFromUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Workspace | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    if (workspace && step === "choose") {
      router.replace("/home");
    }
  }, [workspace, step, router]);

  useEffect(() => {
    if (codeFromUrl) {
      setJoinCode(codeFromUrl);
      if (!workspace) setStep("join");
    } else if (!workspace && stepFromUrl === "join") {
      setStep("join");
    } else if (!workspace && (stepFromUrl === "create" || stepFromUrl === "couple")) {
      setStep("couple");
    } else if (!workspace && stepFromUrl === "solo") {
      setStep("solo");
    }
  }, [codeFromUrl, workspace, stepFromUrl]);

  async function handleSolo(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onCreate({
        mode: "solo",
        name: name.trim() || undefined,
        partnerAName:
          myName.trim() ||
          user?.firstName ||
          user?.username ||
          undefined,
      });
      onEnter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  async function handleCouple(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const ws = await onCreate({
        mode: "couple",
        name: name.trim() || undefined,
        partnerAName: myName.trim(),
        partnerBName: partnerName.trim(),
      });
      setCreated(ws);
      setStep("invite");
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

  const title =
    step === "choose"
      ? "How do you want to start?"
      : step === "solo"
        ? "Start on your own"
        : step === "couple"
          ? "Start with your partner"
          : step === "join"
            ? "Join with a code"
            : "Invite your partner";

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
          <p className="mt-2 text-sm text-ink-muted">{title}</p>
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

        {step === "choose" && (
          <div className="space-y-3 animate-sheet-in">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("solo");
              }}
              className="w-full rounded-2xl border border-line bg-surface-elevated/80 px-4 py-4 text-left transition-colors hover:border-accent/40"
            >
              <p className="font-display text-lg tracking-tight text-ink">
                Just me
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Personal board now. Invite a partner anytime.
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("couple");
              }}
              className="w-full rounded-2xl border border-line bg-surface-elevated/80 px-4 py-4 text-left transition-colors hover:border-accent/40"
            >
              <p className="font-display text-lg tracking-tight text-ink">
                With my partner
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Create a shared space and get an invite code.
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("join");
              }}
              className="w-full rounded-2xl border border-dashed border-line px-4 py-4 text-left transition-colors hover:border-accent/40"
            >
              <p className="font-display text-lg tracking-tight text-ink">
                I have a code
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Join a space your partner already created.
              </p>
            </button>
            {onEnterRoute && (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full pt-2 text-sm text-ink-dim"
              >
                Back
              </button>
            )}
          </div>
        )}

        {step === "solo" && (
          <form onSubmit={handleSolo} className="space-y-4 animate-sheet-in">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-ink-dim">
                Your name
              </span>
              <input
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                placeholder={user?.firstName || "Your name"}
                className="mt-1 w-full rounded-xl border border-line bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-accent placeholder:text-ink-dim/50"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-ink-dim">
                Space name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-xl border border-line bg-surface-elevated px-3 py-2.5 text-sm outline-none focus:border-accent placeholder:text-ink-dim/50"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-surface disabled:opacity-40"
            >
              {busy ? "Creating…" : "Enter my space"}
            </button>
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="w-full text-sm text-ink-dim"
            >
              Back
            </button>
          </form>
        )}

        {step === "couple" && (
          <form onSubmit={handleCouple} className="space-y-4 animate-sheet-in">
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
              {busy ? "Creating…" : "Create shared space"}
            </button>
            <button
              type="button"
              onClick={() => setStep("choose")}
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
                className="mt-1 w-full rounded-xl border border-line bg-surface-elevated px-3 py-2.5 text-sm tracking-widest uppercase outline-none focus:border-accent placeholder:text-ink-dim/50"
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
              onClick={() => setStep("choose")}
              className="w-full text-sm text-ink-dim"
            >
              Back
            </button>
          </form>
        )}

        {step === "invite" && activeWorkspace && (
          <div className="space-y-4 text-center animate-sheet-in">
            <p className="text-sm text-ink-muted">
              Space ready. Share this with your partner so they can join:
            </p>
            <p className="font-display text-3xl tracking-[0.2em] text-accent-strong">
              {activeWorkspace.inviteCode}
            </p>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      activeWorkspace.inviteCode
                    );
                    setCopied("code");
                    setTimeout(() => setCopied(null), 1500);
                  } catch {
                    /* ignore */
                  }
                }}
                className="w-full rounded-full border border-line py-3 text-sm text-ink"
              >
                {copied === "code" ? "Code copied" : "Copy invite code"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteLink);
                    setCopied("link");
                    setTimeout(() => setCopied(null), 1500);
                  } catch {
                    /* ignore */
                  }
                }}
                className="w-full rounded-full border border-line py-3 text-sm text-ink"
              >
                {copied === "link" ? "Link copied" : "Copy invite link"}
              </button>
            </div>
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
                setStep("choose");
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

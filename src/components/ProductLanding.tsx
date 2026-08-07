"use client";

import { useEffect, useState, type ReactNode } from "react";

interface Props {
  onCreate: () => void;
  onJoin: () => void;
  /** Shown when the visitor already has a couple space */
  onContinue?: () => void;
  continueLabel?: string;
  headerActions?: ReactNode;
  signedInHint?: ReactNode;
}

export function ProductLanding({
  onCreate,
  onJoin,
  onContinue,
  continueLabel = "Open your space",
  headerActions,
  signedInHint,
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="relative min-h-screen min-h-dvh bg-[#040404] text-ink overflow-x-hidden">
      {/* Hero: keep composition */}
      <section className="relative min-h-screen min-h-dvh flex flex-col">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-15%,rgba(143,168,184,0.2),transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#070707_0%,#040404_42%,#020202_100%)]" />
          <div className="absolute -right-1/4 top-1/4 h-[36rem] w-[36rem] rounded-full bg-accent/[0.06] blur-3xl animate-drift-slow" />
          <div className="absolute -left-1/5 bottom-0 h-[28rem] w-[28rem] rounded-full bg-white/[0.03] blur-3xl animate-drift" />
        </div>

        <div
          className={`relative z-10 flex flex-1 flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-8 lg:px-12 transition-all duration-700 ease-out ${
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <header className="flex items-center justify-between py-2 gap-3">
            <p className="font-display text-xl tracking-tight text-ink sm:text-2xl">
              Tandem
            </p>
            <div className="flex items-center gap-3">
              {headerActions}
              <button
                type="button"
                onClick={onJoin}
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Join
              </button>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center pt-8 pb-6 sm:pt-10">
            <p className="font-display text-[clamp(3rem,9vw,6rem)] leading-[0.92] tracking-[-0.04em] text-ink">
              Tandem
            </p>
            <h1 className="mt-4 font-display text-[clamp(1.35rem,3.5vw,1.85rem)] font-normal tracking-tight text-accent-strong text-balance">
              Run life together
            </h1>
            <p className="mt-4 max-w-md text-base text-ink-muted sm:text-lg leading-relaxed text-balance">
              One shared space for tasks, plans, and lists. Both of you in
              sync.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              {onContinue ? (
                <button
                  type="button"
                  onClick={onContinue}
                  className="rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-surface transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
                >
                  {continueLabel}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCreate}
                  className="rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-surface transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start together
                </button>
              )}
              <button
                type="button"
                onClick={onContinue ? onCreate : onJoin}
                className="rounded-full border border-line px-8 py-3.5 text-sm font-medium text-ink-muted transition-colors hover:border-accent/50 hover:text-ink"
              >
                {onContinue ? "Start a new space" : "I have a code"}
              </button>
            </div>
            {onContinue && (
              <button
                type="button"
                onClick={onJoin}
                className="mt-3 text-sm text-ink-dim hover:text-ink"
              >
                Join with a code
              </button>
            )}
            {signedInHint}
          </div>
        </div>

        <div
          aria-hidden
          className={`relative z-10 mt-auto w-full transition-all duration-1000 delay-150 ease-out ${
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="pointer-events-none absolute inset-x-0 -top-16 h-24 bg-gradient-to-b from-transparent to-[#040404]" />
          <ProductStage />
        </div>
      </section>

      {/* Capture + AI */}
      <section className="relative border-t border-line/60 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">
            Capture
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl text-balance">
            Capture in one breath
          </p>
          <p className="mt-4 max-w-lg text-base text-ink-muted leading-relaxed">
            Type &ldquo;tomorrow dinner&rdquo; or &ldquo;flight Sunday
            6pm, pick them up.&rdquo; Smart capture reads the moment,
            and Ask AI can propose a plan plus a follow-up task. Nothing saves
            until you confirm.
          </p>
        </div>
      </section>

      {/* Split view */}
      <section className="relative px-5 py-20 sm:px-8 lg:px-12 bg-gradient-to-b from-transparent via-accent/[0.04] to-transparent">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">
            Home
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl text-balance">
            Mine. Yours. Together.
          </p>
          <p className="mt-4 max-w-lg text-base text-ink-muted leading-relaxed">
            See what each of you is carrying, and what you share, without a
            scoreboard. Ping your partner when something&apos;s blocked. Pin
            what matters. Soft fairness tips stay opt-in.
          </p>
        </div>
      </section>

      {/* Rhythm */}
      <section className="relative border-t border-line/60 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">
            Rhythm
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl text-balance">
            The week, not just the list
          </p>
          <p className="mt-4 max-w-lg text-base text-ink-muted leading-relaxed">
            Shared calendar, grocery lists, evening check-ins, quiet morning
            digests, and a Sunday review co-pilot, so the small things stop
            slipping between you.
          </p>
        </div>
      </section>

      {/* Inside the space: quiet inventory, not a feature grid of cards */}
      <section className="relative border-t border-line/60 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">
            Inside
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl text-balance">
            What you both open
          </p>
          <p className="mt-4 max-w-lg text-base text-ink-muted leading-relaxed">
            Everything lives in one couple space: same board, same plans, same
            lists.
          </p>
          <ul className="mt-10 divide-y divide-line/50 border-y border-line/50">
            {INSIDE.map((item) => (
              <li
                key={item.label}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <span className="shrink-0 font-display text-lg tracking-tight text-ink sm:w-36">
                  {item.label}
                </span>
                <span className="text-sm text-ink-muted leading-relaxed">
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI helper */}
      <section className="relative px-5 py-20 sm:px-8 lg:px-12 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">
            AI helper
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl text-balance">
            Proposes. You decide.
          </p>
          <p className="mt-4 max-w-lg text-base text-ink-muted leading-relaxed">
            Smarter capture, weekly focus ideas, unblock drafts, and a quiet
            digest, always as suggestions. No chatbot takeover. No edits without
            you.
          </p>
        </div>
      </section>

      {/* Accounts + invite */}
      <section className="relative border-t border-line/60 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">
            Together
          </p>
          <p className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl text-balance">
            Your accounts. One invite.
          </p>
          <p className="mt-4 max-w-lg text-base text-ink-muted leading-relaxed">
            Sign in, create a space, share the code. Your partner joins with
            their own account. Two seats, one shared board. Leave anytime;
            regenerating the rhythm stays with you both.
          </p>
          <ol className="mt-10 space-y-5">
            {[
              "Sign up with your account and claim your seat",
              "Create a space and get an invite code",
              "Partner joins and you share the same board",
            ].map((line, i) => (
              <li key={line} className="flex items-start gap-4">
                <span className="font-display text-2xl leading-none text-accent-strong/80 tabular-nums">
                  {i + 1}
                </span>
                <span className="pt-1 text-sm text-ink-muted sm:text-base">
                  {line}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-line/60 px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-display text-3xl tracking-tight text-ink sm:text-[2.75rem] text-balance">
            Build your space in a minute
          </p>
          <p className="mt-4 text-sm text-ink-muted leading-relaxed">
            Create an account, start a couple space, and send the invite. You
            both land in the same home.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onContinue ?? onCreate}
              className="rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-surface transition-all hover:bg-white hover:scale-[1.02]"
            >
              {onContinue ? continueLabel : "Start together"}
            </button>
            <button
              type="button"
              onClick={onJoin}
              className="rounded-full border border-line px-8 py-3.5 text-sm font-medium text-ink-muted hover:text-ink"
            >
              Join with a code
            </button>
          </div>
        </div>
        <p className="mt-16 text-center text-[11px] text-ink-dim">
          Tandem: co-execution for two
        </p>
      </section>
    </div>
  );
}

const INSIDE = [
  {
    label: "Add",
    detail: "Natural-language capture with optional Ask AI proposals.",
  },
  {
    label: "Home",
    detail: "Today, focus, pings, digests, and Mine / Yours / Together.",
  },
  {
    label: "Tasks",
    detail: "Board with snooze, pin, block, comments, and undo.",
  },
  {
    label: "Calendar",
    detail: "Shared plans, recurring events, evening conflict hints.",
  },
  {
    label: "Lists",
    detail: "Groceries and shared checklists. Paste a whole list at once.",
  },
  {
    label: "Review",
    detail: "Weekly co-pilot: what got done, what’s stuck, three focus ideas.",
  },
];

function ProductStage() {
  return (
    <div className="relative w-full overflow-hidden border-t border-line/40 bg-[#0a0a0a]">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-0 md:grid-cols-12 min-h-[42vh] sm:min-h-[48vh]">
        <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-line/50 px-6 py-8 sm:px-8 sm:py-10">
          <p className="font-display text-2xl tracking-tight text-ink">Hey</p>
          <p className="mt-1 text-sm text-ink-dim">3 due today · in sync</p>
          <p className="mt-5 text-[12px] leading-relaxed text-ink-dim/90 border-l border-accent/40 pl-3">
            Morning · Airport pickup · Confirm dinner · Groceries tonight
          </p>
          <div className="mt-6 space-y-3">
            {[
              { who: "Together", title: "Groceries for the week" },
              { who: "Mine", title: "Send the lease docs" },
              { who: "Yours", title: "Book Friday dinner" },
            ].map((row) => (
              <div key={row.title} className="flex items-start gap-3">
                <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[4px] border border-accent/50" />
                <div>
                  <p className="text-sm text-ink">{row.title}</p>
                  <p className="text-[11px] text-ink-dim">{row.who}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-7 px-6 py-8 sm:px-8 sm:py-10">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent">
            Tonight
          </p>
          <p className="mt-3 font-display text-xl tracking-tight text-ink">
            Date night · 7:00
          </p>
          <p className="mt-2 text-sm text-ink-muted max-w-sm">
            Calendar, lists, and the board in one place you both can open and
            trust.
          </p>
          <div className="mt-8 space-y-2 max-w-sm">
            <p className="text-[11px] text-ink-dim">Ask AI proposed</p>
            <p className="text-sm text-ink-muted leading-relaxed">
              Event · Flight arrives Sunday 6pm
              <br />
              Task · Pick her up · Mine
            </p>
            <p className="text-[11px] text-accent-strong/80">
              Nothing saved until you confirm
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-dim">
            {["Capture", "Home", "Tasks", "Calendar", "Lists", "Review"].map(
              (label) => (
                <span key={label}>{label}</span>
              )
            )}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#040404] to-transparent" />
    </div>
  );
}

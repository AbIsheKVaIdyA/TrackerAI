"use client";

import { useState } from "react";
import type { CoupleSettings, PartnerId, Task } from "@/lib/types";
import { partnerName } from "@/lib/types";
import { aiClient } from "@/lib/ai/client";

interface Props {
  task: Task;
  settings: CoupleSettings;
  me: PartnerId;
  onSendPing?: (message: string) => Promise<unknown>;
}

export function UnblockCoach({ task, settings, me, onSendPing }: Props) {
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [partnerMessage, setPartnerMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (task.status !== "blocked") return null;

  const other: PartnerId = me === "a" ? "b" : "a";

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await aiClient.unblock({
        title: task.title,
        notes: task.notes,
        myName: partnerName(me, settings),
        partnerName: partnerName(other, settings),
      });
      setNextStep(r.nextStep);
      setPartnerMessage(r.partnerMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-line bg-surface px-3 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ink-muted uppercase tracking-wide">
          Unblock coach
        </p>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="text-[11px] text-accent-strong hover:underline disabled:opacity-40"
        >
          {loading ? "…" : nextStep ? "Refresh" : "Suggest"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {nextStep && (
        <>
          <p className="text-sm text-ink">
            <span className="text-ink-dim">Next step: </span>
            {nextStep}
          </p>
          {partnerMessage && (
            <div className="rounded-lg border border-line/70 bg-surface-elevated px-2.5 py-2">
              <p className="text-[11px] text-ink-dim mb-1">Draft ping</p>
              <p className="text-sm text-ink-muted">{partnerMessage}</p>
              {onSendPing && (
                <button
                  type="button"
                  disabled={sent}
                  onClick={async () => {
                    await onSendPing(partnerMessage);
                    setSent(true);
                  }}
                  className="mt-2 text-[11px] text-accent-strong hover:underline disabled:opacity-40"
                >
                  {sent ? "Sent" : "Send @Partner ping"}
                </button>
              )}
            </div>
          )}
          <p className="text-[10px] text-ink-dim">Proposal only. Nothing was auto-changed.</p>
        </>
      )}
    </div>
  );
}

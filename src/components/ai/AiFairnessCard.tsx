"use client";

import { useEffect, useState } from "react";
import type { CoupleSettings, Task } from "@/lib/types";
import { aiClient } from "@/lib/ai/client";

interface Props {
  tasks: Task[];
  settings: CoupleSettings;
  enabled: boolean;
}

export function AiFairnessCard({ tasks, settings, enabled }: Props) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || dismissed) return;
    const open = tasks.filter((t) => t.status !== "done");
    const a = open.filter((t) => t.assignee === "a").map((t) => t.title);
    const b = open.filter((t) => t.assignee === "b").map((t) => t.title);
    const both = open.filter((t) => t.assignee === "both").map((t) => t.title);
    if (a.length + b.length < 2) return;

    setLoading(true);
    void aiClient
      .fairness({
        partnerAName: settings.partnerAName,
        partnerBName: settings.partnerBName,
        openByAssignee: {
          a: a.slice(0, 12),
          b: b.slice(0, 12),
          both: both.slice(0, 8),
        },
      })
      .then((r) => {
        setSuggestion(r.suggestion);
        setRationale(r.rationale);
      })
      .catch(() => setSuggestion(null))
      .finally(() => setLoading(false));
  }, [tasks, settings, enabled, dismissed]);

  if (!enabled || dismissed || (!loading && !suggestion)) return null;

  return (
    <section className="border border-line/80 rounded-task px-3.5 py-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          Soft balance · AI
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[11px] text-ink-dim hover:text-ink"
        >
          Dismiss
        </button>
      </div>
      {loading && <p className="text-sm text-ink-dim">Checking load…</p>}
      {suggestion && (
        <>
          <p className="text-sm text-ink">{suggestion}</p>
          {rationale && (
            <p className="text-[11px] text-ink-dim">{rationale}</p>
          )}
          <p className="text-[10px] text-ink-dim">
            Suggestion only. You choose what to change.
          </p>
        </>
      )}
    </section>
  );
}

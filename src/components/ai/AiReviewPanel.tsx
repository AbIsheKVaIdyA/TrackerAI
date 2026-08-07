"use client";

import { useState } from "react";
import type { Assignee, CalendarEvent, CoupleSettings, PartnerId, Task } from "@/lib/types";
import { formatShortDate, partnerName, toDateKey } from "@/lib/types";
import { aiClient } from "@/lib/ai/client";
import type { AiReviewResult } from "@/lib/ai/types";
import type { NewTaskInput } from "@/hooks/useTasks";

interface Props {
  tasks: Task[];
  events: CalendarEvent[];
  settings: CoupleSettings;
  me: PartnerId;
  weekStart: string;
  weekEnd: string;
  onAddFocus?: (input: NewTaskInput) => Promise<unknown>;
}

export function AiReviewPanel({
  tasks,
  events,
  settings,
  me,
  weekStart,
  weekEnd,
  onAddFocus,
}: Props) {
  const [data, setData] = useState<AiReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const done = tasks
        .filter(
          (t) =>
            t.status === "done" &&
            t.completedAt &&
            toDateKey(t.completedAt) >= weekStart &&
            toDateKey(t.completedAt) <= weekEnd
        )
        .map((t) => ({ title: t.title, assignee: t.assignee }));
      const open = tasks
        .filter((t) => t.status !== "done")
        .slice(0, 40)
        .map((t) => ({
          title: t.title,
          assignee: t.assignee,
          status: t.status,
          dueDate: t.dueDate,
        }));
      const weekEvents = events
        .filter((e) => {
          const k = toDateKey(e.startsAt);
          return k >= weekStart && k <= weekEnd;
        })
        .map((e) => ({
          title: e.title,
          when: formatShortDate(e.startsAt),
        }));

      const r = await aiClient.review({
        partnerAName: settings.partnerAName,
        partnerBName: settings.partnerBName,
        done,
        open,
        events: weekEvents,
      });
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border border-accent/30 bg-accent-dim/40 rounded-task px-3.5 py-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-accent-strong">
            Weekly co-pilot
          </p>
          <p className="text-[11px] text-ink-dim">
            Soft summary and 3 focus ideas. You confirm anything added.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-surface disabled:opacity-40"
        >
          {loading ? "Thinking…" : data ? "Refresh" : "Ask AI"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {data && (
        <div className="space-y-3">
          <p className="text-sm text-ink-muted leading-relaxed">{data.summary}</p>
          {data.stuck.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-ink-dim mb-1">
                Stuck
              </p>
              <ul className="space-y-1 text-sm text-ink-muted">
                {data.stuck.map((s, i) => (
                  <li key={i}>· {s}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-dim mb-1.5">
              Suggested focus
            </p>
            <ul className="space-y-2">
              {data.focus.map((f, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-line/70 bg-surface/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{f.title}</p>
                    <p className="text-[11px] text-ink-dim">
                      {f.assignee === "both"
                        ? "Together"
                        : partnerName(f.assignee as PartnerId, settings)}
                      {f.reason ? ` · ${f.reason}` : ""}
                    </p>
                  </div>
                  {onAddFocus && (
                    <button
                      type="button"
                      disabled={adding === f.title}
                      onClick={async () => {
                        setAdding(f.title);
                        try {
                          await onAddFocus({
                            title: f.title,
                            category: "other",
                            priority: "normal",
                            dueDate: null,
                            assignee: f.assignee as Assignee,
                            createdBy: me,
                            notes: f.reason || undefined,
                          });
                        } finally {
                          setAdding(null);
                        }
                      }}
                      className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted hover:text-ink disabled:opacity-40"
                    >
                      {adding === f.title ? "…" : "Add as task"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

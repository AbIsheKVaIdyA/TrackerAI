"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent, CoupleSettings, PartnerId, Task } from "@/lib/types";
import { partnerName, toDateKey, todayKey } from "@/lib/types";
import { aiClient } from "@/lib/ai/client";
import type { AiDigestResult } from "@/lib/ai/types";

const KEY = "tandem_ai_digest";

interface Props {
  tasks: Task[];
  events: CalendarEvent[];
  settings: CoupleSettings;
  me: PartnerId;
}

function slotNow(): "morning" | "evening" | null {
  const h = new Date().getHours();
  if (h >= 6 && h < 11) return "morning";
  if (h >= 17 && h < 23) return "evening";
  return null;
}

export function AiDigestCard({ tasks, events, settings, me }: Props) {
  const [data, setData] = useState<AiDigestResult | null>(null);
  const [hidden, setHidden] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tone = slotNow();
    if (!tone) return;
    const stamp = `${todayKey()}-${tone}`;
    if (localStorage.getItem(KEY) === stamp) return;

    const today = todayKey();
    const other: PartnerId = me === "a" ? "b" : "a";
    setHidden(false);
    setLoading(true);
    void aiClient
      .digest({
        tone,
        myName: partnerName(me, settings),
        partnerName: partnerName(other, settings),
        tasks: tasks
          .filter((t) => t.status !== "done")
          .slice(0, 24)
          .map((t) => ({
            title: t.title,
            dueDate: t.dueDate,
            status: t.status,
            assignee: t.assignee,
          })),
        events: events
          .filter((e) => toDateKey(e.startsAt) === today)
          .slice(0, 12)
          .map((e) => ({ title: e.title, when: e.startsAt })),
      })
      .then(setData)
      .catch(() => setHidden(true))
      .finally(() => setLoading(false));
  }, [tasks, events, settings, me]);

  if (hidden || (!loading && !data)) return null;

  const tone = data?.tone || slotNow() || "morning";

  return (
    <section className="border border-line rounded-task px-3.5 py-3.5 space-y-2 bg-surface-elevated/60">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.14em] text-accent">
          {tone === "morning" ? "Morning" : "Evening"} · AI digest
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(KEY, `${todayKey()}-${tone}`);
            setHidden(true);
          }}
          className="text-[11px] text-ink-dim hover:text-ink"
        >
          Dismiss
        </button>
      </div>
      {loading && <p className="text-sm text-ink-dim">Gathering what matters…</p>}
      {data && (
        <ul className="space-y-1.5">
          {data.lines.map((line, i) => (
            <li key={i} className="text-sm text-ink-muted">
              {line}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-ink-dim">Suggestion only. Nothing was changed.</p>
    </section>
  );
}

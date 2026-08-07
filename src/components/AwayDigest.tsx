"use client";

import { useEffect, useMemo, useState } from "react";
import type { CoupleSettings, Task } from "@/lib/types";
import { buildActivityFeed, relativeTime } from "@/lib/activity";

const PREFIX = "tandem_last_seen_";
const MIN_AWAY_MS = 3 * 60 * 60 * 1000; // 3 hours

interface Props {
  workspaceId: string | null | undefined;
  tasks: Task[];
  settings: CoupleSettings;
  onEditTask: (task: Task) => void;
}

export function AwayDigest({
  workspaceId,
  tasks,
  settings,
  onEditTask,
}: Props) {
  const [since, setSince] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const key = PREFIX + workspaceId;
    const raw = localStorage.getItem(key);
    const now = Date.now();
    if (raw) {
      const last = Number(raw);
      if (!Number.isNaN(last) && now - last >= MIN_AWAY_MS) {
        setSince(last);
      }
    }
    // Record visit after a beat so this session doesn't wipe "since"
    const t = setTimeout(() => {
      localStorage.setItem(key, String(now));
    }, 2500);
    return () => clearTimeout(t);
  }, [workspaceId]);

  const items = useMemo(() => {
    if (!since) return [];
    return buildActivityFeed(tasks, settings, 12).filter(
      (a) => new Date(a.at).getTime() >= since
    );
  }, [tasks, settings, since]);

  if (dismissed || !since || items.length === 0) return null;

  return (
    <section className="border border-line rounded-task px-3.5 py-3.5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">While you were away</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            Catch up on what moved since your last visit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[11px] text-ink-dim hover:text-ink"
        >
          Dismiss
        </button>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((a) => {
          const task = tasks.find((t) => a.id.endsWith(t.id) || a.id.includes(t.id));
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => task && onEditTask(task)}
                className="flex w-full items-baseline justify-between gap-2 text-left text-sm"
              >
                <span className="min-w-0">
                  <span className="text-ink-dim">{a.label}</span>{" "}
                  <span className="text-ink">{a.title}</span>
                </span>
                <span className="shrink-0 text-[11px] text-ink-dim">
                  {relativeTime(a.at)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

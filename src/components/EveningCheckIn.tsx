"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CalendarEvent, Task } from "@/lib/types";
import { formatTime, todayKey } from "@/lib/types";

const STORAGE_KEY = "tandem_evening_checkin";

interface Props {
  tonightEvents: CalendarEvent[];
  focusOpen: Task[];
  onEditTask: (task: Task) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

function dismissedToday(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === todayKey();
}

function isEveningNow(): boolean {
  const h = new Date().getHours();
  return h >= 17 && h < 23;
}

export function EveningCheckIn({
  tonightEvents,
  focusOpen,
  onEditTask,
  onEditEvent,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isEveningNow() && !dismissedToday());
  }, []);

  if (!visible) return null;

  const hasAnything = tonightEvents.length > 0 || focusOpen.length > 0;

  return (
    <section className="border border-accent/35 bg-accent-dim px-3.5 py-3.5 rounded-task space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-accent-strong">
            Evening check-in
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {hasAnything
              ? "Quick look at tonight. Clear what’s left or you’re set."
              : "Quiet evening on the board. Enjoy it."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, todayKey());
            setVisible(false);
          }}
          className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted hover:text-ink"
        >
          We&apos;re set
        </button>
      </div>

      {tonightEvents.slice(0, 3).map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => onEditEvent(e)}
          className="flex w-full items-center gap-2 text-left text-sm text-ink hover:text-accent-strong"
        >
          <span className="w-12 text-xs tabular-nums text-ink-dim">
            {formatTime(e.startsAt)}
          </span>
          {e.title}
        </button>
      ))}

      {focusOpen.slice(0, 3).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onEditTask(t)}
          className="flex w-full items-center gap-2 text-left text-sm text-ink-muted hover:text-ink"
        >
          <span className="text-accent">·</span>
          {t.title}
        </button>
      ))}

      <div className="flex gap-3 pt-0.5 text-[11px]">
        <Link href="/lists" className="text-ink-dim hover:text-ink">
          Lists →
        </Link>
        <Link href="/review" className="text-ink-dim hover:text-ink">
          Weekly review →
        </Link>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "tandem_sunday_nudge";

function weekKey(): string {
  const d = new Date();
  const start = new Date(d);
  const day = start.getDay();
  const diff = day === 0 ? 0 : -day; // Sunday start for this nudge
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
}

export function SundayNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isSunday = new Date().getDay() === 0;
    if (!isSunday) return;
    if (localStorage.getItem(STORAGE_KEY) === weekKey()) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <section className="border border-accent/35 bg-accent-dim px-3.5 py-3 rounded-task flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-accent-strong">Sunday review</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          Five minutes on what you did and what&apos;s left.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, weekKey());
            setVisible(false);
          }}
          className="rounded-full border border-line px-3 py-1.5 text-[11px] text-ink-muted hover:text-ink"
        >
          Later
        </button>
        <Link
          href="/review"
          onClick={() => localStorage.setItem(STORAGE_KEY, weekKey())}
          className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-medium text-surface"
        >
          Open review
        </Link>
      </div>
    </section>
  );
}

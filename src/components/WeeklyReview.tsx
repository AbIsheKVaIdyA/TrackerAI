"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CalendarEvent, CoupleSettings, PartnerId, Task } from "@/lib/types";
import {
  addDays,
  formatShortDate,
  partnerName,
  startOfWeek,
  toDateKey,
  todayKey,
} from "@/lib/types";
import { expandEventsForRange } from "@/lib/calendar-utils";
import { AiReviewPanel } from "./ai/AiReviewPanel";
import type { NewTaskInput } from "@/hooks/useTasks";

interface Props {
  tasks: Task[];
  events: CalendarEvent[];
  settings: CoupleSettings;
  me: PartnerId;
  onAddTask?: (input: NewTaskInput) => Promise<unknown>;
}

export function WeeklyReview({
  tasks,
  events,
  settings,
  me,
  onAddTask,
}: Props) {
  const weekStart = startOfWeek(new Date());
  const weekEnd = addDays(weekStart, 6);
  const startKey = toDateKey(weekStart);
  const endKey = toDateKey(weekEnd);
  const today = todayKey();
  const other: PartnerId = me === "a" ? "b" : "a";

  const doneThisWeek = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== "done" || !t.completedAt) return false;
      const k = toDateKey(t.completedAt);
      return k >= startKey && k <= endKey;
    });
  }, [tasks, startKey, endKey]);

  const stillOpen = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
  }, [tasks]);

  const weekEvents = useMemo(() => {
    return expandEventsForRange(events, startKey, endKey);
  }, [events, startKey, endKey]);

  const overdue = stillOpen.filter((t) => t.dueDate && t.dueDate < today);
  const blocked = stillOpen.filter((t) => t.status === "blocked");

  const rangeLabel = `${weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} to ${weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight text-ink">
          Weekly review
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {rangeLabel} · what you did together, what&apos;s left
        </p>
      </div>

      <AiReviewPanel
        tasks={tasks}
        events={events}
        settings={settings}
        me={me}
        weekStart={startKey}
        weekEnd={endKey}
        onAddFocus={onAddTask}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border border-line rounded-task px-3.5 py-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-dim">Done</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {doneThisWeek.length}
          </p>
        </div>
        <div className="border border-line rounded-task px-3.5 py-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-dim">Still open</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {stillOpen.length}
          </p>
        </div>
        <div className="border border-line rounded-task px-3.5 py-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-dim">Events</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {weekEvents.length}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">What we did</h2>
        {doneThisWeek.length === 0 ? (
          <p className="border border-dashed border-line px-3 py-4 text-sm text-ink-dim">
            Nothing marked done this week yet. There&apos;s still time.
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line/80 rounded-task overflow-hidden">
            {doneThisWeek.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 text-sm"
              >
                <span className="text-accent">✓</span>
                <span className="text-ink">{t.title}</span>
                <span className="text-[11px] text-ink-dim">
                  {t.assignee === "both"
                    ? "Together"
                    : partnerName(t.assignee, settings)}
                  {t.completedAt ? ` · ${formatShortDate(t.completedAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-accent-strong">
            Overdue: clear these first
          </h2>
          <ul className="space-y-1 text-sm text-ink-muted">
            {overdue.map((t) => (
              <li key={t.id}>
                {t.title}
                {t.dueDate ? ` · due ${formatShortDate(t.dueDate)}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {blocked.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">
            Blocked: {partnerName(other, settings)} may need you
          </h2>
          <ul className="space-y-1 text-sm text-ink-muted">
            {blocked.map((t) => (
              <li key={t.id}>
                {t.title}
                {t.notes ? `: ${t.notes}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">What&apos;s left</h2>
        {stillOpen.length === 0 ? (
          <p className="border border-dashed border-line px-3 py-4 text-sm text-ink-dim">
            Board is clear. Nice week.
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line/80 rounded-task overflow-hidden">
            {stillOpen.slice(0, 20).map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 text-sm text-ink"
              >
                <span>{t.title}</span>
                <span className="text-[11px] text-ink-dim">
                  {t.assignee === "both"
                    ? "Together"
                    : partnerName(t.assignee, settings)}
                  {t.dueDate ? ` · ${formatShortDate(t.dueDate)}` : ""}
                  {t.status === "in_progress" ? " · in progress" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">This week on the calendar</h2>
        {weekEvents.length === 0 ? (
          <p className="text-sm text-ink-dim">No events scheduled.</p>
        ) : (
          <ul className="space-y-1.5 text-sm text-ink-muted">
            {weekEvents.map((e) => (
              <li key={e.id}>
                {formatShortDate(e.startsAt)} · {e.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-ink-dim">
        <Link href="/home" className="hover:text-ink">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

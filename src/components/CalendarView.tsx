"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  assigneeLabel,
  formatTime,
  startOfWeek,
  toDateKey,
  todayKey,
  type CalendarEvent,
  type CoupleSettings,
  type PartnerId,
} from "@/lib/types";
import {
  buildIcs,
  downloadIcs,
  expandEventsForRange,
  findEveningConflicts,
} from "@/lib/calendar-utils";

interface Props {
  events: CalendarEvent[];
  settings: CoupleSettings;
  me: PartnerId;
  onAdd: (defaults?: { startsAt?: string }) => void;
  onEdit: (event: CalendarEvent) => void;
}

function chipClass(assignee: CalendarEvent["assignee"], me: PartnerId) {
  if (assignee === "both") return "bg-accent/25 text-accent-strong border-accent/40";
  if (assignee === me) return "bg-ink/15 text-ink border-ink/30";
  return "bg-white/[0.06] text-ink-muted border-line";
}

export function CalendarView({
  events,
  settings,
  me,
  onAdd,
  onEdit,
}: Props) {
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState(() => todayKey());

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekAnchor, i);
      return { date: d, key: toDateKey(d) };
    });
  }, [weekAnchor]);

  const rangeStart = days[0].key;
  const rangeEnd = days[6].key;

  const expanded = useMemo(
    () => expandEventsForRange(events, rangeStart, rangeEnd),
    [events, rangeStart, rangeEnd]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) map.set(day.key, []);
    for (const e of expanded) {
      const key = toDateKey(e.startsAt);
      if (!map.has(key)) continue;
      map.get(key)!.push(e);
    }
    map.forEach((list) => {
      list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    });
    return map;
  }, [expanded, days]);

  const selectedEvents = byDay.get(selected) ?? [];
  const conflicts = useMemo(
    () => findEveningConflicts(expanded, selected),
    [expanded, selected]
  );
  const today = todayKey();
  const weekLabel = `${days[0].date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} to ${days[6].date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

  function resolveSeries(e: CalendarEvent): CalendarEvent {
    if (!e.occurrenceOf) return e;
    return events.find((x) => x.id === e.occurrenceOf) ?? e;
  }

  function exportIcs() {
    const ics = buildIcs(events, settings.coupleLabel || "Tandem");
    downloadIcs("tandem.ics", ics);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-ink-muted">{weekLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekAnchor((w) => addDays(w, -7))}
            className="rounded border border-line px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => {
              const w = startOfWeek(new Date());
              setWeekAnchor(w);
              setSelected(todayKey());
            }}
            className="rounded border border-line px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setWeekAnchor((w) => addDays(w, 7))}
            className="rounded border border-line px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={exportIcs}
            className="rounded border border-line px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink"
            title="Download .ics for Google / Apple Calendar"
          >
            Export .ics
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date(selected + "T09:00:00");
              onAdd({ startsAt: d.toISOString() });
            }}
            className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-surface"
          >
            + Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map(({ date, key }) => {
          const list = byDay.get(key) ?? [];
          const isSelected = key === selected;
          const isToday = key === today;
          const dayConflicts = findEveningConflicts(expanded, key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`min-h-[5.5rem] sm:min-h-[7rem] rounded border px-1 py-1.5 text-left transition-colors ${
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-line/80 hover:border-accent/30"
              }`}
            >
              <div className="flex items-baseline justify-between px-0.5">
                <span className="text-[10px] uppercase text-ink-dim">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span
                  className={`text-xs tabular-nums ${
                    isToday
                      ? "rounded-full bg-accent px-1.5 text-surface font-medium"
                      : "text-ink-muted"
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
              {dayConflicts.length > 0 && (
                <p className="px-0.5 text-[9px] text-accent-strong">Busy</p>
              )}
              <div className="mt-1 space-y-0.5">
                {list.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className={`truncate rounded border px-1 py-0.5 text-[10px] leading-tight ${chipClass(
                      e.assignee,
                      me
                    )}`}
                  >
                    {e.title}
                  </div>
                ))}
                {list.length > 3 && (
                  <p className="text-[10px] text-ink-dim px-0.5">
                    +{list.length - 3}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {conflicts.length > 0 && (
        <div className="border border-accent/35 bg-accent-dim px-3.5 py-2.5 rounded-task">
          <p className="text-sm font-medium text-accent-strong">
            Evening overlap
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            You both look busy the same evening. Maybe pick one plan.
          </p>
          <ul className="mt-1.5 space-y-0.5 text-xs text-ink-dim">
            {conflicts.slice(0, 3).map((c, i) => (
              <li key={i}>
                {c.a.title} ↔ {c.b.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section>
        <h2 className="mb-1.5 text-sm font-semibold text-ink">
          {new Date(selected + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        {selectedEvents.length === 0 ? (
          <p className="border border-dashed border-line px-3 py-6 text-center text-sm text-ink-dim">
            No events.{" "}
            <button
              type="button"
              className="text-accent-strong hover:underline"
              onClick={() =>
                onAdd({ startsAt: new Date(selected + "T09:00:00").toISOString() })
              }
            >
              add one
            </button>
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-task border border-line/80">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onEdit(resolveSeries(e))}
                  className="flex w-full items-start gap-3 px-3.5 py-3 text-left hover:bg-white/[0.03]"
                >
                  <span className="shrink-0 text-xs tabular-nums text-ink-muted w-16">
                    {formatTime(e.startsAt)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{e.title}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-dim">
                      {assigneeLabel(e.assignee, settings, me)}
                      {e.endsAt ? ` · until ${formatTime(e.endsAt)}` : ""}
                      {e.recur === "daily"
                        ? " · daily"
                        : e.recur === "weekly"
                          ? " · weekly"
                          : ""}
                    </span>
                    {e.notes && (
                      <span className="mt-0.5 block text-[11px] text-ink-muted">
                        {e.notes}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

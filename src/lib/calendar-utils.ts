import {
  addDays,
  toDateKey,
  type CalendarEvent,
  type PartnerId,
} from "./types";

/** Expand recurring events into occurrences overlapping [rangeStart, rangeEnd] (date keys). */
export function expandEventsForRange(
  events: CalendarEvent[],
  rangeStart: string,
  rangeEnd: string
): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const startBound = new Date(rangeStart + "T00:00:00");
  const endBound = new Date(rangeEnd + "T23:59:59");

  for (const e of events) {
    if (!e.recur) {
      const key = toDateKey(e.startsAt);
      if (key >= rangeStart && key <= rangeEnd) out.push(e);
      continue;
    }

    const base = new Date(e.startsAt);
    const durationMs = e.endsAt
      ? new Date(e.endsAt).getTime() - base.getTime()
      : 60 * 60 * 1000;
    const until = e.recurUntil
      ? new Date(e.recurUntil + "T23:59:59")
      : addDays(startBound, 90);

    let cursor = new Date(base);
    // Walk forward from base until past range end / until
    let guard = 0;
    while (cursor <= endBound && cursor <= until && guard < 400) {
      guard++;
      if (cursor >= startBound) {
        const startsAt = cursor.toISOString();
        const endsAt = new Date(cursor.getTime() + durationMs).toISOString();
        const isBase = toDateKey(startsAt) === toDateKey(e.startsAt);
        out.push({
          ...e,
          id: isBase ? e.id : `${e.id}_${toDateKey(startsAt)}`,
          startsAt,
          endsAt,
          occurrenceOf: isBase ? undefined : e.id,
        });
      }
      if (e.recur === "daily") {
        cursor = addDays(cursor, 1);
      } else {
        cursor = addDays(cursor, 7);
      }
    }
  }

  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function findEveningConflicts(
  events: CalendarEvent[],
  dayKey: string
): { a: CalendarEvent; b: CalendarEvent }[] {
  const dayEvents = events.filter((e) => toDateKey(e.startsAt) === dayKey);
  const conflicts: { a: CalendarEvent; b: CalendarEvent }[] = [];

  for (let i = 0; i < dayEvents.length; i++) {
    for (let j = i + 1; j < dayEvents.length; j++) {
      const x = dayEvents[i];
      const y = dayEvents[j];
      if (!coversPartners(x, y)) continue;
      if (!overlaps(x, y)) continue;
      // Evening window 17:00-23:00 local
      if (!isEvening(x) && !isEvening(y)) continue;
      conflicts.push({ a: x, b: y });
    }
  }
  return conflicts;
}

function coversPartners(x: CalendarEvent, y: CalendarEvent): boolean {
  const set = new Set<PartnerId | "both">();
  set.add(x.assignee);
  set.add(y.assignee);
  // Conflict when both people are involved somehow
  if (x.assignee === "both" || y.assignee === "both") return true;
  return x.assignee !== y.assignee;
}

function overlaps(x: CalendarEvent, y: CalendarEvent): boolean {
  const xs = new Date(x.startsAt).getTime();
  const xe = x.endsAt ? new Date(x.endsAt).getTime() : xs + 60 * 60 * 1000;
  const ys = new Date(y.startsAt).getTime();
  const ye = y.endsAt ? new Date(y.endsAt).getTime() : ys + 60 * 60 * 1000;
  return xs < ye && ys < xe;
}

function isEvening(e: CalendarEvent): boolean {
  const h = new Date(e.startsAt).getHours();
  return h >= 17 && h < 23;
}

export function buildIcs(events: CalendarEvent[], calName = "Tandem"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tandem//EN",
    `X-WR-CALNAME:${escapeIcs(calName)}`,
  ];

  for (const e of events) {
    const uid = `${e.occurrenceOf ?? e.id}@tandem.local`;
    const dtStart = toIcsUtc(e.startsAt);
    const dtEnd = toIcsUtc(
      e.endsAt ?? new Date(new Date(e.startsAt).getTime() + 3600000).toISOString()
    );
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${toIcsUtc(new Date().toISOString())}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcs(e.title)}`);
    if (e.notes) lines.push(`DESCRIPTION:${escapeIcs(e.notes)}`);
    if (e.recur === "daily") lines.push("RRULE:FREQ=DAILY");
    if (e.recur === "weekly") lines.push("RRULE:FREQ=WEEKLY");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

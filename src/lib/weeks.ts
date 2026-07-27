import type { WeekNumber } from "./types";

export const DEADLINE = new Date("2026-09-01T00:00:00");

export interface WeekDef {
  week: WeekNumber;
  label: string;
  start: Date;
  end: Date;
  rangeLabel: string;
}

/** Week 1 = Jul 28–Aug 3 … Week 5 = Aug 25–31, 2026 */
export const WEEKS: WeekDef[] = [
  {
    week: 1,
    label: "Week 1",
    start: new Date("2026-07-28T00:00:00"),
    end: new Date("2026-08-03T23:59:59"),
    rangeLabel: "Jul 28 – Aug 3",
  },
  {
    week: 2,
    label: "Week 2",
    start: new Date("2026-08-04T00:00:00"),
    end: new Date("2026-08-10T23:59:59"),
    rangeLabel: "Aug 4 – Aug 10",
  },
  {
    week: 3,
    label: "Week 3",
    start: new Date("2026-08-11T00:00:00"),
    end: new Date("2026-08-17T23:59:59"),
    rangeLabel: "Aug 11 – Aug 17",
  },
  {
    week: 4,
    label: "Week 4",
    start: new Date("2026-08-18T00:00:00"),
    end: new Date("2026-08-24T23:59:59"),
    rangeLabel: "Aug 18 – Aug 24",
  },
  {
    week: 5,
    label: "Week 5",
    start: new Date("2026-08-25T00:00:00"),
    end: new Date("2026-08-31T23:59:59"),
    rangeLabel: "Aug 25 – Aug 31",
  },
];

export function daysUntilDeadline(now = new Date()): number {
  const ms = DEADLINE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Current execution week (1–5). Before week 1 starts → 1. After week 5 → 5. */
export function getCurrentWeek(now = new Date()): WeekNumber {
  if (now < WEEKS[0].start) return 1;
  for (const w of WEEKS) {
    if (now >= w.start && now <= w.end) return w.week;
  }
  return 5;
}

export function getWeekDef(week: WeekNumber): WeekDef {
  return WEEKS.find((w) => w.week === week)!;
}

/** True if the week's end date has passed. */
export function isWeekPast(week: WeekNumber, now = new Date()): boolean {
  return now > getWeekDef(week).end;
}

export function isInCurrentWeek(date: Date | string, now = new Date()): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const current = getWeekDef(getCurrentWeek(now));
  return d >= current.start && d <= current.end;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

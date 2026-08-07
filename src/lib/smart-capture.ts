import { addDays, toDateKey, todayKey } from "./types";

export type CaptureMode = "task" | "event";

export interface SmartCaptureHints {
  mode?: CaptureMode;
  dueChip?: "none" | "today" | "tomorrow" | "pick";
  dueDate?: string;
  eventDate?: string;
  eventTime?: string;
  assignee?: "both";
  category?: "home" | "money" | "social" | "other";
  cleanedTitle?: string;
}

const PLAN_WORDS =
  /\b(dinner|lunch|brunch|breakfast|coffee|meet|meeting|call|date|movie|concert|party|flight|appointment|visit)\b/i;
const DO_WORDS =
  /\b(buy|pay|finish|submit|clean|fix|send|book|schedule|pick up|pickup|call|email|wash|organize)\b/i;

function nextWeekday(target: number, from = new Date()): Date {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  let add = (target - day + 7) % 7;
  if (add === 0) add = 7;
  return addDays(d, add);
}

function parseTime(text: string): string | null {
  const m24 = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m24) {
    return `${m24[1].padStart(2, "0")}:${m24[2]}`;
  }
  const m12 = text.match(/\b(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (m12) {
    let h = Number(m12[1]);
    const min = m12[2] ?? "00";
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${min}`;
  }
  if (/\btonight\b/i.test(text)) return "19:00";
  return null;
}

/** Lightweight client-side parse, no AI API */
export function parseSmartCapture(raw: string): SmartCaptureHints {
  const text = raw.trim();
  if (!text) return {};

  const hints: SmartCaptureHints = {};
  const lower = text.toLowerCase();

  const time = parseTime(text);
  if (time) {
    hints.eventTime = time;
    hints.mode = "event";
  }

  if (/\btomorrow\b/i.test(text)) {
    const key = toDateKey(addDays(new Date(), 1));
    hints.dueChip = "tomorrow";
    hints.dueDate = key;
    hints.eventDate = key;
  } else if (/\btoday\b|\btonight\b/i.test(text)) {
    const key = todayKey();
    hints.dueChip = "today";
    hints.dueDate = key;
    hints.eventDate = key;
  } else {
    const days: [RegExp, number][] = [
      [/\b(on\s+)?sunday\b/i, 0],
      [/\b(on\s+)?monday\b/i, 1],
      [/\b(on\s+)?tuesday\b/i, 2],
      [/\b(on\s+)?wednesday\b/i, 3],
      [/\b(on\s+)?thursday\b/i, 4],
      [/\b(on\s+)?friday\b/i, 5],
      [/\b(on\s+)?saturday\b/i, 6],
    ];
    for (const [re, day] of days) {
      if (re.test(text)) {
        const key = toDateKey(nextWeekday(day));
        hints.dueChip = "pick";
        hints.dueDate = key;
        hints.eventDate = key;
        break;
      }
    }
  }

  if (PLAN_WORDS.test(text) || time) {
    hints.mode = "event";
  } else if (DO_WORDS.test(text)) {
    hints.mode = hints.mode ?? "task";
  }

  if (/\b(grocery|groceries|milk|eggs)\b/i.test(lower)) {
    hints.category = "home";
    hints.assignee = "both";
    hints.mode = hints.mode ?? "task";
  } else if (/\b(bill|rent|utilities|pay)\b/i.test(lower)) {
    hints.category = "money";
    hints.assignee = "both";
    hints.mode = hints.mode ?? "task";
  } else if (/\b(date night|dinner|movie)\b/i.test(lower)) {
    hints.category = "social";
    hints.assignee = "both";
    hints.mode = "event";
  } else if (/\b(chore|clean|laundry|dishes)\b/i.test(lower)) {
    hints.category = "home";
    hints.mode = hints.mode ?? "task";
  }

  return hints;
}

export const CAPTURE_TEMPLATES = [
  {
    id: "groceries",
    label: "Groceries",
    title: "Pick up groceries",
    mode: "task" as const,
    assignee: "both" as const,
    dueChip: "tomorrow" as const,
    category: "home" as const,
  },
  {
    id: "bills",
    label: "Bills",
    title: "Pay shared bills",
    mode: "task" as const,
    assignee: "both" as const,
    dueChip: "today" as const,
    category: "money" as const,
    priority: "critical" as const,
  },
  {
    id: "date",
    label: "Date night",
    title: "Date night",
    mode: "event" as const,
    assignee: "both" as const,
    eventTime: "19:00",
    category: "social" as const,
  },
  {
    id: "chores",
    label: "Chores",
    title: "Do the chores",
    mode: "task" as const,
    assignee: "both" as const,
    dueChip: "today" as const,
    category: "home" as const,
  },
] as const;

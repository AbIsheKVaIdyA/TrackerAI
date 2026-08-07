import { addDays, toDateKey, todayKey } from "./types";

export type SnoozePreset = "tomorrow" | "weekend" | "week";

export function snoozeDate(preset: SnoozePreset, fromDue?: string | null): string {
  const base = fromDue && fromDue >= todayKey()
    ? new Date(fromDue + "T12:00:00")
    : new Date();

  if (preset === "tomorrow") {
    return toDateKey(addDays(new Date(), 1));
  }

  if (preset === "weekend") {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    const day = d.getDay(); // 0 Sun … 6 Sat
    let add = (6 - day + 7) % 7; // next Saturday
    if (add === 0) add = 7;
    return toDateKey(addDays(d, add));
  }

  // +7 days from today (or from current due if in future)
  return toDateKey(addDays(base, 7));
}

export const SNOOZE_OPTIONS: { value: SnoozePreset; label: string }[] = [
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "Weekend" },
  { value: "week", label: "+1 week" },
];

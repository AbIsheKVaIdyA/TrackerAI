import { addDays, toDateKey, type RecurRule, type Task } from "./types";

export function nextDueDate(
  dueDate: string | null | undefined,
  recur: RecurRule
): string {
  const base = dueDate
    ? new Date(dueDate + "T12:00:00")
    : new Date();
  const next = recur === "daily" ? addDays(base, 1) : addDays(base, 7);
  return toDateKey(next);
}

/** Whether completing this task should spawn the next occurrence. */
export function shouldSpawnNext(task: Task, nextDue: string): boolean {
  if (!task.recur) return false;
  if (task.recurUntil && nextDue > task.recurUntil) return false;
  return true;
}

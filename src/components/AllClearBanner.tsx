"use client";

import type { Task } from "@/lib/types";
import { todayKey } from "@/lib/types";

interface Props {
  tasks: Task[];
}

export function AllClearBanner({ tasks }: Props) {
  const today = todayKey();
  const dueToday = tasks.filter((t) => t.dueDate === today);
  if (dueToday.length === 0) return null;

  const open = dueToday.filter((t) => t.status !== "done");
  if (open.length > 0) return null;

  return (
    <section className="border border-accent/30 bg-accent-dim px-3.5 py-3 rounded-task">
      <p className="text-sm font-semibold text-accent-strong">
        All clear for today
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">
        Everything due today is done. Nice work. Enjoy the evening.
      </p>
    </section>
  );
}

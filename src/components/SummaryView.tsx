"use client";

import { useMemo, useState } from "react";
import type { Assignee, CoupleSettings, Task, WeekNumber } from "@/lib/types";
import { getCurrentWeek, WEEKS } from "@/lib/weeks";
import { TaskRow } from "./TaskRow";

interface Props {
  tasks: Task[];
  settings: CoupleSettings;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onPushNext: (task: Task) => Promise<unknown>;
  onAssignWeek: (id: string, week: WeekNumber | null) => Promise<unknown>;
  onSetAssignee: (id: string, assignee: Assignee) => Promise<unknown>;
}

export function SummaryView({
  tasks,
  settings,
  onCycleStatus,
  onSetBlocked,
  onPushNext,
  onAssignWeek,
  onSetAssignee,
}: Props) {
  const [week, setWeek] = useState<WeekNumber>(() => {
    const current = getCurrentWeek();
    return current > 1 ? ((current - 1) as WeekNumber) : current;
  });

  const weekTasks = useMemo(
    () => tasks.filter((t) => t.weekAssigned === week),
    [tasks, week]
  );

  const done = weekTasks.filter((t) => t.status === "done");
  const unfinished = weekTasks.filter((t) => t.status !== "done");
  const weekDef = WEEKS.find((w) => w.week === week)!;

  async function pushAllUnfinished() {
    for (const t of unfinished) {
      if (t.weekAssigned != null && t.weekAssigned < 5) {
        await onPushNext(t);
      }
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            End-of-week summary
          </h1>
          <p className="text-sm text-ink-muted">
            What finished, what slipped — push unfinished to next week.
          </p>
        </div>
        <select
          value={week}
          onChange={(e) => setWeek(Number(e.target.value) as WeekNumber)}
          className="rounded border border-line bg-surface-elevated px-2 py-1.5 text-sm outline-none focus:border-critical"
        >
          {WEEKS.map((w) => (
            <option key={w.week} value={w.week}>
              {w.label} · {w.rangeLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="border border-line bg-surface-elevated px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-ink-dim">Done</p>
          <p className="text-2xl font-semibold tabular-nums text-green-400">
            {done.length}
          </p>
        </div>
        <div className="border border-line bg-surface-elevated px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-ink-dim">
            Unfinished
          </p>
          <p className="text-2xl font-semibold tabular-nums text-critical">
            {unfinished.length}
          </p>
        </div>
        <div className="border border-line bg-surface-elevated px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-ink-dim">
            Completion
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {weekTasks.length === 0
              ? "—"
              : `${Math.round((done.length / weekTasks.length) * 100)}%`}
          </p>
        </div>
      </div>

      <section className="mb-5">
        <h2 className="mb-1.5 text-sm font-semibold text-green-400">
          Completed · {weekDef.label}
        </h2>
        {done.length === 0 ? (
          <p className="border border-dashed border-line px-3 py-4 text-sm text-ink-dim">
            No completions logged for this week.
          </p>
        ) : (
          <div className="divide-y divide-line-subtle border border-line bg-surface-elevated/50">
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                settings={settings}
                onCycleStatus={onCycleStatus}
                onSetBlocked={onSetBlocked}
                onSetAssignee={onSetAssignee}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-critical">
            Unfinished · {weekDef.label}
          </h2>
          {unfinished.length > 0 && week < 5 && (
            <button
              type="button"
              onClick={pushAllUnfinished}
              className="rounded border border-line px-2.5 py-1 text-xs text-ink-muted hover:border-critical hover:text-critical"
            >
              Push all to Week {week + 1}
            </button>
          )}
        </div>
        {unfinished.length === 0 ? (
          <p className="border border-dashed border-green-500/30 px-3 py-4 text-sm text-green-400/80">
            Clean slate — everything assigned to this week is done.
          </p>
        ) : (
          <div className="divide-y divide-line-subtle border border-line bg-surface-elevated/50">
            {unfinished.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                settings={settings}
                onCycleStatus={onCycleStatus}
                onSetBlocked={onSetBlocked}
                onAssignWeek={onAssignWeek}
                onSetAssignee={onSetAssignee}
                onPushNext={onPushNext}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

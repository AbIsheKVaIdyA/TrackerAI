"use client";

import { useMemo, useState } from "react";
import type { Assignee, CoupleSettings, Task, WeekNumber } from "@/lib/types";
import { getCurrentWeek, WEEKS } from "@/lib/weeks";
import { TaskGroupList } from "./TaskGroupList";

interface Props {
  tasks: Task[];
  settings: CoupleSettings;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onAssignWeek: (id: string, week: WeekNumber | null) => Promise<unknown>;
  onSetAssignee: (id: string, assignee: Assignee) => Promise<unknown>;
  onPushNext: (task: Task) => Promise<unknown>;
}

export function WeekView({
  tasks,
  settings,
  onCycleStatus,
  onSetBlocked,
  onAssignWeek,
  onSetAssignee,
  onPushNext,
}: Props) {
  const [selected, setSelected] = useState<WeekNumber>(getCurrentWeek());

  const weekTasks = useMemo(
    () => tasks.filter((t) => t.weekAssigned === selected),
    [tasks, selected]
  );

  const done = weekTasks.filter((t) => t.status === "done").length;
  const criticalOpen = weekTasks.filter(
    (t) => t.priority === "critical" && t.status !== "done"
  ).length;

  const weekDef = WEEKS.find((w) => w.week === selected)!;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Week view</h1>
          <p className="text-sm text-ink-muted">
            {weekDef.rangeLabel} · {done}/{weekTasks.length} done
            {criticalOpen > 0 && (
              <span className="text-ink-muted">
                {" "}
                · {criticalOpen} critical open
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
        {WEEKS.map((w) => {
          const count = tasks.filter((t) => t.weekAssigned === w.week).length;
          const openCritical = tasks.filter(
            (t) =>
              t.weekAssigned === w.week &&
              t.priority === "critical" &&
              t.status !== "done"
          ).length;
          const active = selected === w.week;
          return (
            <button
              key={w.week}
              type="button"
              onClick={() => setSelected(w.week)}
              className={`relative shrink-0 px-2.5 sm:px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "text-ink border-b-2 border-accent -mb-px"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span className="font-medium">W{w.week}</span>
              <span className="ml-1.5 hidden sm:inline text-[11px] text-ink-dim">
                {w.rangeLabel}
              </span>
              <span className="ml-1 tabular-nums text-[11px] text-ink-dim">
                ({count})
              </span>
              {openCritical > 0 && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
              )}
            </button>
          );
        })}
      </div>

      <TaskGroupList
        tasks={weekTasks}
        settings={settings}
        onCycleStatus={onCycleStatus}
        onSetBlocked={onSetBlocked}
        onAssignWeek={onAssignWeek}
        onSetAssignee={onSetAssignee}
        onPushNext={onPushNext}
        emptyLabel={`No tasks in Week ${selected} yet.`}
      />
    </div>
  );
}

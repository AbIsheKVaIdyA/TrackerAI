"use client";

import Link from "next/link";
import type { Assignee, CoupleSettings, PartnerId, Task, WeekNumber } from "@/lib/types";
import { partnerName, progressFor } from "@/lib/types";
import {
  daysUntilDeadline,
  getCurrentWeek,
  getWeekDef,
  isInCurrentWeek,
  isWeekPast,
} from "@/lib/weeks";
import { ProgressRing } from "./ProgressRing";
import { TaskGroupList } from "./TaskGroupList";
import { TaskRow } from "./TaskRow";

interface Props {
  tasks: Task[];
  settings: CoupleSettings;
  me: PartnerId;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onAssignWeek: (id: string, week: WeekNumber | null) => Promise<unknown>;
  onSetAssignee: (id: string, assignee: Assignee) => Promise<unknown>;
}

export function Dashboard({
  tasks,
  settings,
  me,
  onCycleStatus,
  onSetBlocked,
  onAssignWeek,
  onSetAssignee,
}: Props) {
  const daysLeft = daysUntilDeadline();
  const currentWeek = getCurrentWeek();
  const weekDef = getWeekDef(currentWeek);

  const overall = progressFor(tasks, "all");
  const progressA = progressFor(tasks, "a");
  const progressB = progressFor(tasks, "b");

  const criticalRemaining = tasks.filter(
    (t) => t.priority === "critical" && t.status !== "done"
  );

  const overdueCritical = criticalRemaining.filter(
    (t) => t.weekAssigned != null && isWeekPast(t.weekAssigned)
  );

  const backlog = tasks.filter(
    (t) => t.weekAssigned == null && t.status !== "done"
  );

  const thisWeekTasks = tasks.filter((t) => t.weekAssigned === currentWeek);

  const wins = tasks.filter(
    (t) =>
      t.status === "done" &&
      t.completedAt &&
      isInCurrentWeek(t.completedAt)
  );

  const partnerBusy = tasks.filter(
    (t) =>
      t.status === "in_progress" &&
      (t.assignee === (me === "a" ? "b" : "a") || t.assignee === "both")
  );

  const needsHelp = tasks.filter((t) => t.status === "blocked");
  const otherName = partnerName(me === "a" ? "b" : "a", settings);

  return (
    <div className="space-y-5">
      {overdueCritical.length > 0 && (
        <div className="border border-red-500/50 bg-red-500/10 px-3 py-2.5">
          <p className="text-sm font-semibold text-red-400">
            {overdueCritical.length} critical task
            {overdueCritical.length === 1 ? "" : "s"} overdue
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {overdueCritical.map((t) => (
              <li key={t.id} className="text-sm text-red-300/90">
                <span className="text-red-500/70">W{t.weekAssigned}</span> — {t.title}
                <span className="ml-1.5 text-[11px] text-ink-dim">
                  ({t.assignee === "both" ? "Shared" : partnerName(t.assignee, settings)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 border border-line bg-surface-elevated px-3 py-3 sm:col-span-2 lg:col-span-1">
          <ProgressRing percent={overall.percent} size={72} stroke={7} label="done" />
          <div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {daysLeft}
            </p>
            <p className="text-xs text-ink-muted">days until Sep 1</p>
            <p className="mt-0.5 text-xs text-ink-dim">
              {overall.done}/{overall.total} done
            </p>
          </div>
        </div>

        <div className="border border-critical/40 bg-critical-dim px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-critical">
            {settings.partnerAName}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-critical">
            {Math.round(progressA.percent)}%
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {progressA.done}/{progressA.total} tasks
          </p>
        </div>

        <div className="border border-sky-500/40 bg-sky-500/10 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-sky-300">
            {settings.partnerBName}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-sky-300">
            {Math.round(progressB.percent)}%
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {progressB.done}/{progressB.total} tasks
          </p>
        </div>

        <div className="border border-line bg-surface-elevated px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
            Critical left · W{currentWeek}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-critical">
            {criticalRemaining.length}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            week {thisWeekTasks.filter((t) => t.status === "done").length}/
            {thisWeekTasks.length} · {weekDef.rangeLabel}
          </p>
        </div>
      </div>

      {needsHelp.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-sm font-semibold text-red-400">
            Blocked — needs help
          </h2>
          <p className="mb-1.5 text-xs text-ink-dim">
            Unblock these or take them over so nothing stalls.
          </p>
          <div className="divide-y divide-line-subtle border border-red-500/30 bg-red-500/[0.06]">
            {needsHelp.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                settings={settings}
                onCycleStatus={onCycleStatus}
                onSetBlocked={onSetBlocked}
                onAssignWeek={onAssignWeek}
                onSetAssignee={onSetAssignee}
                showWeek
              />
            ))}
          </div>
        </section>
      )}

      {partnerBusy.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-sm font-semibold">
            In progress — {otherName}
          </h2>
          <div className="divide-y divide-line-subtle border border-line bg-surface-elevated/50">
            {partnerBusy.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                settings={settings}
                onCycleStatus={onCycleStatus}
                onSetBlocked={onSetBlocked}
                onAssignWeek={onAssignWeek}
                onSetAssignee={onSetAssignee}
                showWeek
              />
            ))}
          </div>
        </section>
      )}

      {backlog.length > 0 && (
        <section>
          <div className="mb-1.5 flex items-baseline justify-between px-0.5">
            <h2 className="text-sm font-semibold">Unscheduled backlog</h2>
            <Link href="/backlog" className="text-xs text-ink-muted hover:text-ink">
              Manage →
            </Link>
          </div>
          <div className="divide-y divide-line-subtle border border-line bg-surface-elevated/50">
            {backlog.slice(0, 5).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                settings={settings}
                onCycleStatus={onCycleStatus}
                onSetBlocked={onSetBlocked}
                onAssignWeek={onAssignWeek}
                onSetAssignee={onSetAssignee}
                showWeek
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-1.5 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">
            Current week — Week {currentWeek}
          </h2>
          <Link href="/week" className="text-xs text-ink-muted hover:text-ink">
            Full week view →
          </Link>
        </div>
        <TaskGroupList
          tasks={thisWeekTasks}
          settings={settings}
          onCycleStatus={onCycleStatus}
          onSetBlocked={onSetBlocked}
          onAssignWeek={onAssignWeek}
          onSetAssignee={onSetAssignee}
          emptyLabel="No tasks assigned to this week yet."
        />
      </section>

      <section>
        <h2 className="mb-1.5 text-sm font-semibold">This week&apos;s wins</h2>
        {wins.length === 0 ? (
          <p className="border border-dashed border-line px-3 py-4 text-sm text-ink-dim">
            Nothing completed this week yet.
          </p>
        ) : (
          <ul className="divide-y divide-line-subtle border border-line bg-surface-elevated/50">
            {wins.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm text-green-400/90"
              >
                <span className="text-green-500">✓</span>
                <span className={t.priority === "critical" ? "text-critical" : ""}>
                  {t.title}
                </span>
                <span className="text-[11px] text-ink-dim">
                  {t.assignee === "both"
                    ? "Shared"
                    : partnerName(t.assignee, settings)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {criticalRemaining.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-sm font-semibold text-critical">
            All critical remaining
          </h2>
          <div className="divide-y divide-line-subtle border border-critical/30 bg-critical-dim/30">
            {criticalRemaining.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                settings={settings}
                onCycleStatus={onCycleStatus}
                onSetBlocked={onSetBlocked}
                onAssignWeek={onAssignWeek}
                onSetAssignee={onSetAssignee}
                showWeek
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

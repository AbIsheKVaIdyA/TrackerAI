"use client";

import Link from "next/link";
import { useMemo } from "react";
import type {
  Assignee,
  CalendarEvent,
  CoupleSettings,
  PartnerId,
  PartnerPing,
  Task,
  Workspace,
} from "@/lib/types";
import {
  assigneeLabel,
  formatTime,
  partnerName,
  progressFor,
  todayKey,
  toDateKey,
} from "@/lib/types";
import { buildActivityFeed, relativeTime } from "@/lib/activity";
import { AllClearBanner } from "./AllClearBanner";
import { AwayDigest } from "./AwayDigest";
import { EveningCheckIn } from "./EveningCheckIn";
import { ProgressRing } from "./ProgressRing";
import { SundayNudge } from "./SundayNudge";
import { TaskRow } from "./TaskRow";
import { AiDigestCard } from "./ai/AiDigestCard";
import { AiFairnessCard } from "./ai/AiFairnessCard";

interface Props {
  tasks: Task[];
  events: CalendarEvent[];
  settings: CoupleSettings;
  me: PartnerId;
  workspace: Workspace | null;
  pings: PartnerPing[];
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onSetAssignee: (id: string, assignee: Assignee) => Promise<unknown>;
  onSetDueDate: (id: string, dueDate: string | null) => Promise<unknown>;
  onSetPinned?: (id: string, pinned: boolean) => Promise<unknown>;
  onEditTask: (task: Task) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onPingPartner?: (task: Task) => Promise<unknown>;
  onDismissPing?: (id: string) => Promise<unknown>;
  onToggleFairness?: (show: boolean) => Promise<unknown>;
}

function openFor(tasks: Task[], who: PartnerId | "both") {
  return tasks.filter(
    (t) =>
      t.status !== "done" &&
      (who === "both" ? t.assignee === "both" : t.assignee === who)
  );
}

export function Dashboard({
  tasks,
  events,
  settings,
  me,
  workspace,
  pings,
  onCycleStatus,
  onSetBlocked,
  onSetAssignee,
  onSetDueDate,
  onSetPinned,
  onEditTask,
  onEditEvent,
  onPingPartner,
  onDismissPing,
  onToggleFairness,
}: Props) {
  const today = todayKey();
  const overall = progressFor(tasks, "all");
  const progressA = progressFor(tasks, "a");
  const progressB = progressFor(tasks, "b");
  const other: PartnerId = me === "a" ? "b" : "a";
  const otherName = partnerName(other, settings);
  const myName = partnerName(me, settings);

  const todayTasks = tasks.filter(
    (t) => t.status !== "done" && t.dueDate === today
  );
  const overdue = tasks.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate < today
  );
  const todayEvents = events
    .filter((e) => toDateKey(e.startsAt) === today)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const tonightEvents = todayEvents.filter(
    (e) => new Date(e.startsAt).getHours() >= 17
  );
  const focusTasks = tasks
    .filter(
      (t) =>
        t.status !== "done" &&
        (t.dueDate === today || t.priority === "critical" || t.status === "in_progress")
    )
    .slice(0, 5);

  const activity = useMemo(
    () => buildActivityFeed(tasks, settings, 6),
    [tasks, settings]
  );

  const mineOpen = openFor(tasks, me);
  const yoursOpen = openFor(tasks, other);
  const togetherOpen = openFor(tasks, "both");

  const partnerBusy = tasks.filter(
    (t) =>
      t.status === "in_progress" &&
      (t.assignee === other || t.assignee === "both")
  );
  const needsHelp = tasks.filter((t) => t.status === "blocked");
  const pinned = tasks.filter((t) => t.pinned && t.status !== "done");

  const showFairness = !!workspace?.showFairness;

  const rowProps = {
    settings,
    me,
    onCycleStatus,
    onSetBlocked,
    onSetAssignee,
    onSetDueDate,
    onSetPinned,
    onEdit: onEditTask,
    onPingPartner,
  };
  const loadA = openFor(tasks, "a").length;
  const loadB = openFor(tasks, "b").length;
  const loadBoth = togetherOpen.length;
  const loadTotal = loadA + loadB + loadBoth || 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 pt-0.5">
        <div>
          <p className="font-display text-2xl sm:text-[2rem] tracking-tight text-ink">
            Hey, {myName}
          </p>
          <p className="mt-1.5 text-sm text-ink-muted">
            {todayTasks.length} due today
            {overdue.length > 0 ? ` · ${overdue.length} overdue` : ""}
            {" · "}
            <Link href="/lists" className="text-accent-strong/90 hover:text-accent-strong">
              Lists
            </Link>
          </p>
        </div>
        <Link
          href="/capture"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface"
        >
          + Add
        </Link>
      </div>

      <AiDigestCard
        tasks={tasks}
        events={events}
        settings={settings}
        me={me}
      />

      {pings.length > 0 && (
        <div className="border border-accent/40 bg-accent-dim px-3.5 py-3 rounded-task space-y-2">
          <p className="text-sm font-semibold text-accent-strong">
            {otherName} asked for help
          </p>
          {pings.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="flex items-start justify-between gap-2 text-sm text-ink"
            >
              <span>{p.message}</span>
              {onDismissPing && (
                <button
                  type="button"
                  onClick={() => void onDismissPing(p.id)}
                  className="shrink-0 text-xs text-ink-dim hover:text-ink"
                >
                  Got it
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {overdue.length > 0 && (
        <div className="border border-accent/30 bg-accent-dim px-3.5 py-2.5 rounded-task">
          <p className="text-sm font-semibold text-accent-strong">
            {overdue.length} overdue
          </p>
        </div>
      )}

      <SundayNudge />

      <AwayDigest
        workspaceId={workspace?.id}
        tasks={tasks}
        settings={settings}
        onEditTask={onEditTask}
      />

      <AllClearBanner tasks={tasks} />

      <EveningCheckIn
        tonightEvents={tonightEvents}
        focusOpen={focusTasks.filter((t) => t.status !== "done")}
        onEditTask={onEditTask}
        onEditEvent={onEditEvent}
      />

      {pinned.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-sm font-semibold text-ink">Pinned</h2>
          <div className="divide-y divide-line overflow-hidden rounded-task border border-line/80">
            {pinned.map((task) => (
              <TaskRow key={task.id} task={task} {...rowProps} />
            ))}
          </div>
        </section>
      )}

      {(tonightEvents.length > 0 || focusTasks.length > 0) && (
        <section className="border border-line rounded-task px-3.5 py-3.5 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">Tonight & focus</h2>
            <Link href="/calendar" className="text-[11px] text-ink-dim hover:text-ink">
              Calendar
            </Link>
          </div>
          {tonightEvents.length > 0 && (
            <ul className="space-y-1.5">
              {tonightEvents.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onEditEvent(e)}
                    className="flex w-full items-center gap-3 text-left text-sm hover:text-accent-strong"
                  >
                    <span className="w-12 shrink-0 text-xs tabular-nums text-ink-dim">
                      {formatTime(e.startsAt)}
                    </span>
                    <span className="text-ink">{e.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {focusTasks.length > 0 && (
            <ul className="space-y-1 border-t border-line/60 pt-2">
              {focusTasks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onEditTask(t)}
                    className="flex w-full items-center gap-2 text-left text-sm text-ink-muted hover:text-ink"
                  >
                    <span className="text-accent">·</span>
                    <span className="line-clamp-1">{t.title}</span>
                    {t.recur && (
                      <span className="text-[10px] text-ink-dim">↻</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activity.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Recent</h2>
          <ul className="divide-y divide-line border border-line/80 rounded-task overflow-hidden">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-baseline justify-between gap-3 px-3.5 py-2.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="text-ink-dim">{a.label}</span>{" "}
                  <span className="text-ink">{a.title}</span>
                </span>
                <span className="shrink-0 text-[11px] text-ink-dim">
                  {relativeTime(a.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Split view */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">At a glance</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              { key: "mine", label: "Mine", list: mineOpen, tone: "mine" },
              { key: "yours", label: "Yours", list: yoursOpen, tone: "yours" },
              {
                key: "together",
                label: "Together",
                list: togetherOpen,
                tone: "together",
              },
            ] as const
          ).map((col) => (
            <div
              key={col.key}
              className="border border-line bg-surface-elevated rounded-task px-3 py-3"
            >
              <p className="text-[11px] uppercase tracking-[0.12em] text-accent">
                {col.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {col.list.length}
              </p>
              <ul className="mt-2 space-y-1">
                {col.list.slice(0, 3).map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onEditTask(t)}
                      className="text-left text-xs text-ink-muted hover:text-ink line-clamp-1"
                    >
                      {t.title}
                    </button>
                  </li>
                ))}
                {col.list.length === 0 && (
                  <li className="text-xs text-ink-dim">Clear</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {showFairness && (
        <section className="border border-line/80 rounded-task px-3.5 py-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-ink-muted">
              Open load (soft signal, not a scoreboard)
            </p>
            {onToggleFairness && (
              <button
                type="button"
                onClick={() => void onToggleFairness(false)}
                className="text-[11px] text-ink-dim hover:text-ink"
              >
                Hide
              </button>
            )}
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="bg-ink/80"
              style={{ width: `${(loadA / loadTotal) * 100}%` }}
              title={settings.partnerAName}
            />
            <div
              className="bg-accent/70"
              style={{ width: `${(loadB / loadTotal) * 100}%` }}
              title={settings.partnerBName}
            />
            <div
              className="bg-white/20"
              style={{ width: `${(loadBoth / loadTotal) * 100}%` }}
              title="Together"
            />
          </div>
          <p className="mt-2 text-[11px] text-ink-dim">
            {settings.partnerAName} {loadA} · {settings.partnerBName} {loadB} ·
            Together {loadBoth}
          </p>
        </section>
      )}

      {showFairness && (
        <AiFairnessCard
          tasks={tasks}
          settings={settings}
          enabled={showFairness}
        />
      )}

      {!showFairness && onToggleFairness && (
        <button
          type="button"
          onClick={() => void onToggleFairness(true)}
          className="text-[11px] text-ink-dim hover:text-ink-muted"
        >
          Show fairness signal (opt-in)
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 border border-line bg-surface-elevated px-3.5 py-3.5 rounded-task">
          <ProgressRing percent={overall.percent} size={64} stroke={7} label="done" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-ink">Today</p>
            <p className="text-xs text-ink-muted">
              {todayTasks.length} tasks · {todayEvents.length} events
            </p>
          </div>
        </div>
        <div className="border border-line bg-surface-elevated px-3.5 py-3.5 rounded-task">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
            {settings.partnerAName}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {Math.round(progressA.percent)}%
          </p>
        </div>
        <div className="border border-line bg-surface-elevated px-3.5 py-3.5 rounded-task">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
            {settings.partnerBName}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {Math.round(progressB.percent)}%
          </p>
        </div>
      </div>

      {needsHelp.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-sm font-semibold text-ink">
            Blocked: help each other
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-task border border-line/80">
            {needsHelp.map((task) => (
              <TaskRow key={task.id} task={task} {...rowProps} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-1.5 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink">Today&apos;s tasks</h2>
          <Link href="/tasks" className="text-xs text-ink-muted hover:text-ink">
            Board →
          </Link>
        </div>
        {todayTasks.length === 0 ? (
          <p className="border border-dashed border-line px-3 py-4 text-sm text-ink-dim">
            Nothing due today.
          </p>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-task border border-line/80">
            {todayTasks.map((task) => (
              <TaskRow key={task.id} task={task} {...rowProps} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-1.5 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink">Today&apos;s events</h2>
          <Link href="/calendar" className="text-xs text-ink-muted hover:text-ink">
            Calendar →
          </Link>
        </div>
        {todayEvents.length === 0 ? (
          <p className="border border-dashed border-line px-3 py-4 text-sm text-ink-dim">
            No events today.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-task border border-line/80">
            {todayEvents.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onEditEvent(e)}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-white/[0.03]"
                >
                  <span className="text-xs tabular-nums text-ink-muted w-14">
                    {formatTime(e.startsAt)}
                  </span>
                  <span className="text-ink">{e.title}</span>
                  <span className="ml-auto text-[11px] text-ink-dim">
                    {assigneeLabel(e.assignee, settings, me)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {partnerBusy.length > 0 && (
        <section>
          <h2 className="mb-1.5 text-sm font-semibold text-ink">
            In progress · {otherName}
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-task border border-line/80">
            {partnerBusy.map((task) => (
              <TaskRow key={task.id} task={task} {...rowProps} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

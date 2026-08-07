"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Assignee, CoupleSettings, PartnerId, Task } from "@/lib/types";
import { todayKey } from "@/lib/types";
import { TaskRow } from "./TaskRow";

interface Props {
  tasks: Task[];
  settings: CoupleSettings;
  me: PartnerId;
  hasPartner?: boolean;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onSetAssignee: (id: string, assignee: Assignee) => Promise<unknown>;
  onSetDueDate: (id: string, dueDate: string | null) => Promise<unknown>;
  onEdit: (task: Task) => void;
  onPingPartner?: (task: Task) => Promise<unknown>;
  onSetPinned?: (id: string, pinned: boolean) => Promise<unknown>;
}

function sortTasks(list: Task[]) {
  return [...list].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === "critical" ? -1 : 1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function TasksBoard({
  tasks,
  settings,
  me,
  hasPartner = true,
  onCycleStatus,
  onSetBlocked,
  onSetAssignee,
  onSetDueDate,
  onEdit,
  onPingPartner,
  onSetPinned,
}: Props) {
  const [doneOpen, setDoneOpen] = useState(false);
  const today = todayKey();

  const groups = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "done");
    const done = tasks.filter((t) => t.status === "done");
    const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
    const todayList = open.filter((t) => t.dueDate === today);
    const upcoming = open.filter((t) => t.dueDate && t.dueDate > today);
    const noDate = open.filter((t) => !t.dueDate);
    return {
      overdue: sortTasks(overdue),
      today: sortTasks(todayList),
      upcoming: sortTasks(upcoming),
      noDate: sortTasks(noDate),
      done: sortTasks(done),
      openCount: open.length,
    };
  }, [tasks, today]);

  const sections: {
    key: "overdue" | "today" | "upcoming" | "noDate";
    title: string;
    empty?: string;
    tone?: "urgent" | "default";
  }[] = [
    { key: "overdue", title: "Overdue", tone: "urgent" },
    { key: "today", title: "Today" },
    { key: "upcoming", title: "Upcoming" },
    { key: "noDate", title: "Someday", empty: "Nothing parked here." },
  ];

  function renderList(list: Task[], empty: string) {
    if (list.length === 0) {
      return (
        <p className="px-3.5 py-5 text-center text-xs text-ink-dim">{empty}</p>
      );
    }
    return (
      <div className="divide-y divide-line/70">
        {list.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            settings={settings}
            me={me}
            hasPartner={hasPartner}
            onCycleStatus={onCycleStatus}
            onSetBlocked={onSetBlocked}
            onSetAssignee={onSetAssignee}
            onSetDueDate={onSetDueDate}
            onEdit={onEdit}
            onPingPartner={onPingPartner}
            onSetPinned={onSetPinned}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-ink sm:text-[1.75rem]">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {groups.openCount} open
            {groups.today.length > 0 ? ` · ${groups.today.length} today` : ""}
            {groups.overdue.length > 0
              ? ` · ${groups.overdue.length} overdue`
              : ""}
          </p>
        </div>
        <Link
          href="/capture"
          className="rounded-full bg-ink px-3.5 py-2 text-xs font-medium text-surface hover:bg-white transition-colors"
        >
          + Add
        </Link>
      </div>

      {sections.map((sec) => {
        const list = groups[sec.key];
        if (sec.key === "overdue" && list.length === 0) return null;
        if (sec.key === "noDate" && list.length === 0) return null;
        return (
          <section
            key={sec.key}
            className="overflow-hidden rounded-xl border border-line/90 bg-surface-elevated/80"
          >
            <div
              className={`flex items-center justify-between border-b border-line/70 px-3.5 py-2.5 ${
                sec.tone === "urgent" ? "bg-accent/10" : "bg-white/[0.02]"
              }`}
            >
              <h2
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  sec.tone === "urgent" ? "text-accent-strong" : "text-ink-muted"
                }`}
              >
                {sec.title}
              </h2>
              <span className="text-[11px] tabular-nums text-ink-dim">
                {list.length}
              </span>
            </div>
            {renderList(list, sec.empty ?? "Nothing here.")}
          </section>
        );
      })}

      <section className="overflow-hidden rounded-xl border border-line/70 bg-surface-elevated/40">
        <button
          type="button"
          onClick={() => setDoneOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-white/[0.02]"
        >
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Done
            <span className="ml-2 font-normal tabular-nums">
              {groups.done.length}
            </span>
          </h2>
          <span className="text-[11px] text-ink-dim">
            {doneOpen ? "Hide" : "Show"}
          </span>
        </button>
        {doneOpen && (
          <div className="border-t border-line/60">
            {renderList(groups.done, "No completed tasks yet.")}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  assigneeLabel,
  categoryLabel,
  type Assignee,
  type CoupleSettings,
  type Task,
  type WeekNumber,
} from "@/lib/types";
import { WEEKS, formatShortDate, isWeekPast } from "@/lib/weeks";

const STATUS_META: Record<
  Task["status"],
  { label: string; className: string; box: string }
> = {
  todo: {
    label: "Todo",
    className: "text-ink-muted",
    box: "border-ink-dim bg-transparent",
  },
  in_progress: {
    label: "In progress",
    className: "text-blue-400",
    box: "border-blue-500 bg-blue-500/20",
  },
  blocked: {
    label: "Blocked",
    className: "text-red-400",
    box: "border-red-500 bg-red-500/20",
  },
  done: {
    label: "Done",
    className: "text-green-400 line-through decoration-ink-dim",
    box: "border-green-500 bg-green-500",
  },
};

interface Props {
  task: Task;
  settings: CoupleSettings;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onAssignWeek?: (id: string, week: WeekNumber | null) => Promise<unknown>;
  onSetAssignee?: (id: string, assignee: Assignee) => Promise<unknown>;
  onPushNext?: (task: Task) => Promise<unknown>;
  showWeek?: boolean;
  dense?: boolean;
}

export function TaskRow({
  task,
  settings,
  onCycleStatus,
  onSetBlocked,
  onAssignWeek,
  onSetAssignee,
  onPushNext,
  showWeek = false,
  dense = true,
}: Props) {
  const [blocking, setBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState(task.notes ?? "");
  const meta = STATUS_META[task.status];
  const overdue =
    task.priority === "critical" &&
    task.status !== "done" &&
    task.weekAssigned != null &&
    isWeekPast(task.weekAssigned);

  const assigneeTone =
    task.assignee === "b"
      ? "text-sky-300"
      : task.assignee === "both"
        ? "text-ink-muted"
        : "text-critical/80";

  return (
    <div
      className={`group border-l-2 ${
        task.priority === "critical"
          ? overdue
            ? "border-l-red-500 bg-red-500/[0.06]"
            : "border-l-critical bg-critical-dim/40"
          : task.assignee === "b"
            ? "border-l-sky-500/50"
            : task.assignee === "both"
              ? "border-l-ink-dim/40"
              : "border-l-transparent"
      } ${dense ? "py-1.5 px-2" : "py-2.5 px-3"} hover:bg-surface-hover/60 transition-colors`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          title={`Status: ${meta.label} — click to cycle`}
          onClick={() => onCycleStatus(task)}
          className={`mt-0.5 h-4 w-4 shrink-0 rounded-sm border ${meta.box} flex items-center justify-center`}
        >
          {task.status === "done" && (
            <svg viewBox="0 0 12 12" className="h-3 w-3 text-black" aria-hidden>
              <path
                d="M2.5 6.5L5 9l4.5-5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          )}
          {task.status === "in_progress" && (
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          )}
          {task.status === "blocked" && (
            <span className="text-[8px] leading-none text-red-300">!</span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`text-sm ${meta.className}`}>{task.title}</span>
            {task.priority === "critical" && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-critical">
                IMP
              </span>
            )}
            {overdue && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
                Overdue
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-dim">
            <span className={assigneeTone}>
              {assigneeLabel(task.assignee, settings)}
            </span>
            <span>·</span>
            <span>{categoryLabel(task.category)}</span>
            <span>·</span>
            <span className={meta.className.replace("line-through decoration-ink-dim", "")}>
              {meta.label}
            </span>
            {showWeek && (
              <>
                <span>·</span>
                <span>
                  {task.weekAssigned
                    ? `Week ${task.weekAssigned}`
                    : "Unscheduled"}
                </span>
              </>
            )}
            {task.status === "done" && task.completedAt && (
              <>
                <span>·</span>
                <span>Done {formatShortDate(task.completedAt)}</span>
              </>
            )}
            {task.status === "blocked" && task.notes && (
              <>
                <span>·</span>
                <span className="text-red-400/80">Blocked: {task.notes}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-70 group-hover:opacity-100">
          {onSetAssignee && (
            <select
              value={task.assignee}
              onChange={(e) =>
                onSetAssignee(task.id, e.target.value as Assignee)
              }
              className="max-w-[6.5rem] rounded border border-line bg-surface px-1 py-0.5 text-[11px] text-ink-muted outline-none"
              title="Who owns this"
            >
              <option value="a">{settings.partnerAName}</option>
              <option value="b">{settings.partnerBName}</option>
              <option value="both">Shared</option>
            </select>
          )}
          {task.status !== "blocked" && task.status !== "done" && (
            <button
              type="button"
              onClick={() => {
                setBlockReason(task.notes ?? "");
                setBlocking(true);
              }}
              className="rounded px-1.5 py-0.5 text-[11px] text-ink-dim hover:bg-red-500/15 hover:text-red-400"
            >
              Block
            </button>
          )}
          {onAssignWeek && (
            <select
              value={task.weekAssigned ?? ""}
              onChange={(e) =>
                onAssignWeek(
                  task.id,
                  e.target.value === ""
                    ? null
                    : (Number(e.target.value) as WeekNumber)
                )
              }
              className="max-w-[7.5rem] rounded border border-line bg-surface px-1 py-0.5 text-[11px] text-ink-muted outline-none"
              title="Assign week"
            >
              <option value="">Backlog</option>
              {WEEKS.map((w) => (
                <option key={w.week} value={w.week}>
                  W{w.week}
                </option>
              ))}
            </select>
          )}
          {onPushNext &&
            task.weekAssigned != null &&
            task.weekAssigned < 5 &&
            task.status !== "done" && (
              <button
                type="button"
                onClick={() => onPushNext(task)}
                className="rounded px-1.5 py-0.5 text-[11px] text-ink-dim hover:bg-surface-hover hover:text-ink"
                title="Push to next week"
              >
                → W{task.weekAssigned + 1}
              </button>
            )}
        </div>
      </div>

      {blocking && (
        <div className="mt-2 ml-6 flex gap-2">
          <input
            autoFocus
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="What's blocking this?"
            className="flex-1 rounded border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-red-500"
          />
          <button
            type="button"
            onClick={async () => {
              await onSetBlocked(task, blockReason.trim() || "Blocked");
              setBlocking(false);
            }}
            className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setBlocking(false)}
            className="rounded px-2 py-1 text-xs text-ink-muted"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

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
    className: "text-ink",
    box: "border-ink-dim bg-transparent",
  },
  in_progress: {
    label: "In progress",
    className: "text-ink",
    box: "border-accent bg-accent/15",
  },
  blocked: {
    label: "Blocked",
    className: "text-ink-muted",
    box: "border-ink-muted bg-ink/10",
  },
  done: {
    label: "Done",
    className: "text-ink-dim line-through decoration-ink-dim",
    box: "border-ink bg-ink",
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

  const controls = (
    <>
      {onSetAssignee && (
        <select
          value={task.assignee}
          onChange={(e) => onSetAssignee(task.id, e.target.value as Assignee)}
          className="min-w-0 flex-1 sm:flex-none sm:max-w-[6.5rem] rounded border border-accent bg-accent px-1.5 py-1.5 sm:py-0.5 text-[11px] font-medium text-black outline-none [color-scheme:light]"
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
          className="rounded px-2 py-1.5 sm:py-0.5 text-[11px] text-ink-dim hover:bg-surface-hover hover:text-ink"
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
          className="min-w-0 flex-1 sm:flex-none sm:max-w-[7.5rem] rounded border border-accent bg-accent px-1.5 py-1.5 sm:py-0.5 text-[11px] font-medium text-black outline-none [color-scheme:light]"
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
            className="rounded px-2 py-1.5 sm:py-0.5 text-[11px] text-ink-dim hover:bg-surface-hover hover:text-ink"
            title="Push to next week"
          >
            → W{task.weekAssigned + 1}
          </button>
        )}
    </>
  );

  return (
    <div
      className={`group bg-transparent border-l-[3px] ${
        overdue
          ? "border-l-accent"
          : task.priority === "critical"
            ? "border-l-accent"
            : "border-l-transparent"
      } ${dense ? "py-2.5 px-3.5 sm:py-2.5" : "py-3 px-3.5"} hover:bg-white/[0.03] transition-colors`}
    >
      <div className="flex items-start gap-2.5 sm:gap-2">
        <button
          type="button"
          title={`Status: ${meta.label} — tap to cycle`}
          onClick={() => onCycleStatus(task)}
          className={`mt-0.5 h-6 w-6 sm:h-4 sm:w-4 shrink-0 rounded-sm border ${meta.box} flex items-center justify-center`}
        >
          {task.status === "done" && (
            <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-black" aria-hidden>
              <path
                d="M2.5 6.5L5 9l4.5-5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          )}
          {task.status === "in_progress" && (
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          )}
          {task.status === "blocked" && (
            <span className="text-[9px] leading-none text-ink-muted">!</span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`text-[13px] sm:text-sm break-words ${meta.className}`}>
              {task.title}
            </span>
            {task.priority === "critical" && (
              <span className="rounded px-1 py-px text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10">
                IMP
              </span>
            )}
            {overdue && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                Overdue
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-dim">
            <span>{assigneeLabel(task.assignee, settings)}</span>
            <span>·</span>
            <span>{categoryLabel(task.category)}</span>
            <span>·</span>
            <span>{meta.label}</span>
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
                <span className="text-ink-muted">Blocked: {task.notes}</span>
              </>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:hidden">
            {controls}
          </div>
        </div>

        <div className="hidden sm:flex shrink-0 items-center gap-1 opacity-80 group-hover:opacity-100">
          {controls}
        </div>
      </div>

      {blocking && (
        <div className="mt-2 ml-8 sm:ml-6 flex flex-col sm:flex-row gap-2">
          <input
            autoFocus
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="What's blocking this?"
            className="flex-1 rounded border border-line bg-surface-elevated px-2 py-2 sm:py-1 text-xs text-ink outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await onSetBlocked(task, blockReason.trim() || "Blocked");
                setBlocking(false);
              }}
              className="rounded bg-accent px-3 py-2 sm:py-1 text-xs font-medium text-black"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setBlocking(false)}
              className="rounded px-3 py-2 sm:py-1 text-xs text-ink-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

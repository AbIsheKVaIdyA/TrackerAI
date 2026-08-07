"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  assigneeLabel,
  formatShortDate,
  todayKey,
  type Assignee,
  type CoupleSettings,
  type PartnerId,
  type Task,
} from "@/lib/types";
import { SNOOZE_OPTIONS, snoozeDate, type SnoozePreset } from "@/lib/snooze";

const STATUS_META: Record<
  Task["status"],
  { label: string; box: string }
> = {
  todo: {
    label: "Todo",
    box: "border-ink-dim/70 bg-transparent",
  },
  in_progress: {
    label: "In progress",
    box: "border-accent bg-accent/20",
  },
  blocked: {
    label: "Blocked",
    box: "border-ink-muted bg-ink/10",
  },
  done: {
    label: "Done",
    box: "border-ink bg-ink",
  },
};

interface Props {
  task: Task;
  settings: CoupleSettings;
  me: PartnerId;
  hasPartner?: boolean;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onSetAssignee?: (id: string, assignee: Assignee) => Promise<unknown>;
  onSetDueDate?: (id: string, dueDate: string | null) => Promise<unknown>;
  onSetPinned?: (id: string, pinned: boolean) => Promise<unknown>;
  onEdit?: (task: Task) => void;
  onPingPartner?: (task: Task) => Promise<unknown>;
  dense?: boolean;
}

export function TaskRow({
  task,
  settings,
  me,
  hasPartner = true,
  onCycleStatus,
  onSetBlocked,
  onSetAssignee,
  onSetDueDate,
  onSetPinned,
  onEdit,
  onPingPartner,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState(task.notes ?? "");
  const [snoozing, setSnoozing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[task.status];
  const today = todayKey();
  const overdue =
    task.status !== "done" && !!task.dueDate && task.dueDate < today;

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  function applySnooze(preset: SnoozePreset) {
    if (!onSetDueDate) return;
    void onSetDueDate(task.id, snoozeDate(preset, task.dueDate));
    setSnoozing(false);
    setMenuOpen(false);
  }

  const metaBits = [
    assigneeLabel(task.assignee, settings, me),
    task.dueDate
      ? overdue
        ? `Overdue ${formatShortDate(task.dueDate)}`
        : formatShortDate(task.dueDate)
      : null,
    task.status === "in_progress" ? "In progress" : null,
    task.status === "blocked" ? "Blocked" : null,
    task.pinned ? "Pinned" : null,
  ].filter(Boolean);

  return (
    <div
      className={`group relative border-l-2 transition-colors ${
        overdue || task.priority === "critical"
          ? "border-l-accent"
          : "border-l-transparent"
      } ${
        task.status === "done" ? "opacity-55" : ""
      } hover:bg-white/[0.035]`}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          type="button"
          title={`${meta.label}: tap to advance`}
          onClick={() => void onCycleStatus(task)}
          className={`h-5 w-5 shrink-0 rounded-[5px] border ${meta.box} flex items-center justify-center transition-colors`}
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
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          )}
          {task.status === "blocked" && (
            <span className="text-[9px] leading-none text-ink-muted">!</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onEdit?.(task)}
          className="min-w-0 flex-1 text-left"
        >
          <span
            className={`block text-[13px] sm:text-sm leading-snug ${
              task.status === "done"
                ? "text-ink-dim line-through decoration-ink-dim/70"
                : "text-ink"
            }`}
          >
            {task.title}
          </span>
          <span
            className={`mt-0.5 block text-[11px] ${
              overdue ? "text-accent-strong" : "text-ink-dim"
            }`}
          >
            {metaBits.join(" · ")}
          </span>
        </button>

        {task.status === "blocked" && onPingPartner && (
          <button
            type="button"
            onClick={() => void onPingPartner(task)}
            className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent-strong"
          >
            Help
          </button>
        )}

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-surface-hover hover:text-ink ${
              menuOpen ? "bg-surface-hover text-ink" : "sm:opacity-0 sm:group-hover:opacity-100"
            }`}
            aria-label="Task actions"
          >
            <span className="text-base leading-none tracking-widest">···</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-line bg-surface-elevated py-1 shadow-xl">
              {onEdit && (
                <MenuItem
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(task);
                  }}
                >
                  Edit
                </MenuItem>
              )}
              {onSetAssignee && hasPartner && (
                <div className="px-2 py-1.5">
                  <p className="mb-1 px-1 text-[10px] uppercase tracking-wide text-ink-dim">
                    Who
                  </p>
                  <div className="flex gap-0.5">
                    {(
                      [
                        { v: "a" as const, l: settings.partnerAName.slice(0, 1) },
                        { v: "b" as const, l: settings.partnerBName.slice(0, 1) },
                        { v: "both" as const, l: "T" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        title={
                          opt.v === "both"
                            ? "Together"
                            : opt.v === "a"
                              ? settings.partnerAName
                              : settings.partnerBName
                        }
                        onClick={() => {
                          void onSetAssignee(task.id, opt.v);
                          setMenuOpen(false);
                        }}
                        className={`flex-1 rounded-md py-1.5 text-[11px] font-medium ${
                          task.assignee === opt.v
                            ? "bg-accent text-surface"
                            : "bg-surface text-ink-muted hover:text-ink"
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {onSetDueDate && (
                <div className="border-t border-line px-2 py-1.5">
                  <label className="block">
                    <span className="mb-1 block px-1 text-[10px] uppercase tracking-wide text-ink-dim">
                      Due
                    </span>
                    <input
                      type="date"
                      value={task.dueDate ?? ""}
                      onChange={(e) => {
                        void onSetDueDate(task.id, e.target.value || null);
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[11px] text-ink outline-none focus:border-accent [color-scheme:dark]"
                    />
                  </label>
                </div>
              )}
              {onSetDueDate && task.status !== "done" && (
                <MenuItem
                  onClick={() => {
                    setSnoozing(true);
                    setMenuOpen(false);
                  }}
                >
                  Snooze…
                </MenuItem>
              )}
              {onSetPinned && (
                <MenuItem
                  onClick={() => {
                    void onSetPinned(task.id, !task.pinned);
                    setMenuOpen(false);
                  }}
                >
                  {task.pinned ? "Unpin" : "Pin to Home"}
                </MenuItem>
              )}
              {task.status !== "blocked" && task.status !== "done" && (
                <MenuItem
                  onClick={() => {
                    setBlockReason(task.notes ?? "");
                    setBlocking(true);
                    setMenuOpen(false);
                  }}
                >
                  Mark blocked
                </MenuItem>
              )}
              {task.status === "blocked" && onPingPartner && (
                <MenuItem
                  onClick={() => {
                    void onPingPartner(task);
                    setMenuOpen(false);
                  }}
                >
                  Ask partner
                </MenuItem>
              )}
            </div>
          )}
        </div>
      </div>

      {snoozing && onSetDueDate && (
        <div className="flex flex-wrap gap-1.5 border-t border-line/60 bg-white/[0.02] px-3.5 py-2.5 pl-11">
          {SNOOZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => applySnooze(opt.value)}
              className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted hover:border-accent/40 hover:text-ink"
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSnoozing(false)}
            className="rounded-full px-2.5 py-1 text-[11px] text-ink-dim"
          >
            Cancel
          </button>
        </div>
      )}

      {blocking && (
        <div className="flex flex-col gap-2 border-t border-line/60 bg-white/[0.02] px-3.5 py-2.5 pl-11 sm:flex-row sm:items-center">
          <input
            autoFocus
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="What's blocking this?"
            className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs text-ink outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await onSetBlocked(task, blockReason.trim() || "Blocked");
                setBlocking(false);
              }}
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-surface"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setBlocking(false)}
              className="rounded-full px-3 py-1.5 text-xs text-ink-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full px-3 py-2 text-left text-xs text-ink-muted hover:bg-surface-hover hover:text-ink"
    >
      {children}
    </button>
  );
}

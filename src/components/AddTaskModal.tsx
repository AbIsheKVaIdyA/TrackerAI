"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CATEGORIES,
  type Assignee,
  type Category,
  type CoupleSettings,
  type PartnerId,
  type Priority,
  type WeekNumber,
} from "@/lib/types";
import { WEEKS } from "@/lib/weeks";
import type { NewTaskInput } from "@/hooks/useTasks";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => Promise<void>;
  settings: CoupleSettings;
  me: PartnerId;
  defaultWeek?: WeekNumber | null;
}

export function AddTaskModal({
  open,
  onClose,
  onSubmit,
  settings,
  me,
  defaultWeek = null,
}: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [priority, setPriority] = useState<Priority>("normal");
  const [weekAssigned, setWeekAssigned] = useState<WeekNumber | null>(defaultWeek);
  const [assignee, setAssignee] = useState<Assignee>(me);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setCategory("other");
      setPriority("normal");
      setWeekAssigned(defaultWeek ?? null);
      setAssignee(me);
      setNotes("");
      setError(null);
    }
  }, [open, defaultWeek, me]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        priority,
        weekAssigned,
        notes: notes.trim() || undefined,
        assignee,
        createdBy: me,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center bg-black/70 sm:p-4 sm:pt-[8vh]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md border border-line bg-surface-elevated p-5 shadow-xl max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-none pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Add task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-sm px-2 py-1"
          >
            Close
          </button>
        </div>

        <label className="block mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">Title</span>
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-critical"
            placeholder="What needs to get done?"
          />
        </label>

        <div className="mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">
            Assigned to
          </span>
          <div className="mt-1 flex gap-1">
            {(
              [
                { value: "a" as const, label: settings.partnerAName },
                { value: "b" as const, label: settings.partnerBName },
                { value: "both" as const, label: "Shared" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAssignee(opt.value)}
                className={`flex-1 rounded border px-2 py-2 text-xs font-medium transition-colors ${
                  assignee === opt.value
                    ? opt.value === "b"
                      ? "border-sky-500 bg-sky-500/15 text-sky-300"
                      : opt.value === "both"
                        ? "border-ink-muted bg-surface-hover text-ink"
                        : "border-critical bg-critical-dim text-critical"
                    : "border-line text-ink-muted hover:border-ink-dim"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-critical"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">Week</span>
            <select
              value={weekAssigned ?? ""}
              onChange={(e) =>
                setWeekAssigned(
                  e.target.value === "" ? null : (Number(e.target.value) as WeekNumber)
                )
              }
              className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-critical"
            >
              <option value="">Unscheduled</option>
              {WEEKS.map((w) => (
                <option key={w.week} value={w.week}>
                  {w.label} ({w.rangeLabel})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">Priority</span>
          <div className="mt-1 flex gap-1">
            <button
              type="button"
              onClick={() => setPriority("critical")}
              className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                priority === "critical"
                  ? "border-critical bg-critical-dim text-critical"
                  : "border-line text-ink-muted hover:border-ink-dim"
              }`}
            >
              Critical
            </button>
            <button
              type="button"
              onClick={() => setPriority("normal")}
              className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                priority === "normal"
                  ? "border-ink-muted bg-surface-hover text-ink"
                  : "border-line text-ink-muted hover:border-ink-dim"
              }`}
            >
              Normal
            </button>
          </div>
        </div>

        <label className="block mb-4">
          <span className="text-xs text-ink-muted uppercase tracking-wide">
            Notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-critical resize-y"
          />
        </label>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full rounded bg-ink py-2.5 text-sm font-medium text-surface hover:bg-white disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add task"}
        </button>
      </form>
    </div>
  );
}

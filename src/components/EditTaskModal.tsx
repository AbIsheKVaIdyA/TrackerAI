"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CATEGORIES,
  type Assignee,
  type Category,
  type CoupleSettings,
  type PartnerId,
  type Priority,
  type RecurRule,
  type Status,
  type Task,
} from "@/lib/types";
import { TaskComments } from "./TaskComments";
import { UnblockCoach } from "./ai/UnblockCoach";

interface Props {
  open: boolean;
  task: Task | null;
  settings: CoupleSettings;
  me: PartnerId;
  workspaceId?: string | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate?: (task: Task) => Promise<void>;
  onSendPing?: (message: string, taskId: string) => Promise<unknown>;
}

const STATUSES: { value: Status; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export function EditTaskModal({
  open,
  task,
  settings,
  me,
  workspaceId,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onSendPing,
}: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [priority, setPriority] = useState<Priority>("normal");
  const [status, setStatus] = useState<Status>("todo");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState<Assignee>("a");
  const [notes, setNotes] = useState("");
  const [recur, setRecur] = useState<RecurRule | null>(null);
  const [recurUntil, setRecurUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setCategory(task.category);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ?? "");
      setAssignee(task.assignee);
      setNotes(task.notes ?? "");
      setRecur(task.recur ?? null);
      setRecurUntil(task.recurUntil ?? "");
      setError(null);
    }
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !task) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !task) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(task.id, {
        title: title.trim(),
        category,
        priority,
        status,
        dueDate: dueDate || null,
        assignee,
        notes: notes.trim() || undefined,
        recur: recur ?? null,
        recurUntil: recur ? recurUntil || null : null,
        completedAt: status === "done" ? task.completedAt ?? new Date().toISOString() : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task || !confirm("Delete this task?")) return;
    setDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate() {
    if (!task || !onDuplicate) return;
    setDuplicating(true);
    setError(null);
    try {
      await onDuplicate(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate");
    } finally {
      setDuplicating(false);
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
          <h2 className="text-base font-semibold">Edit task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-sm px-2 py-1"
          >
            Close
          </button>
        </div>

        {(status === "blocked" || task.status === "blocked") && (
          <UnblockCoach
            task={{ ...task, status: "blocked", title, notes }}
            settings={settings}
            me={me}
            onSendPing={
              onSendPing
                ? (message) => onSendPing(message, task.id)
                : undefined
            }
          />
        )}

        <label className="block mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">Title</span>
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
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
                { value: "both" as const, label: "Together" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAssignee(opt.value)}
                className={`flex-1 rounded-full border px-2 py-2 text-xs font-medium transition-colors ${
                  assignee === opt.value
                    ? "border-accent bg-accent text-surface"
                    : "border-line text-ink-muted hover:border-accent/40"
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
              className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-accent"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Due date
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-accent [color-scheme:dark]"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-accent"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Priority
            </span>
            <div className="mt-1 flex gap-1">
              <button
                type="button"
                onClick={() => setPriority("critical")}
                className={`flex-1 rounded border px-2 py-2 text-xs font-medium ${
                  priority === "critical"
                    ? "border-ink bg-ink text-surface"
                    : "border-line text-ink-muted"
                }`}
              >
                Critical
              </button>
              <button
                type="button"
                onClick={() => setPriority("normal")}
                className={`flex-1 rounded border px-2 py-2 text-xs font-medium ${
                  priority === "normal"
                    ? "border-ink-muted bg-surface-hover text-ink"
                    : "border-line text-ink-muted"
                }`}
              >
                Normal
              </button>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">
            Repeats
          </span>
          <div className="mt-1 flex gap-1">
            {(
              [
                { value: null, label: "Once" },
                { value: "weekly" as const, label: "Weekly" },
                { value: "daily" as const, label: "Daily" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setRecur(opt.value)}
                className={`flex-1 rounded-full border px-2 py-2 text-xs font-medium transition-colors ${
                  recur === opt.value
                    ? "border-accent bg-accent text-surface"
                    : "border-line text-ink-muted hover:border-accent/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {recur && (
          <label className="block mb-3">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Until (optional)
            </span>
            <input
              type="date"
              value={recurUntil}
              onChange={(e) => setRecurUntil(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-accent [color-scheme:dark]"
            />
          </label>
        )}

        <label className="block mb-4">
          <span className="text-xs text-ink-muted uppercase tracking-wide">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent resize-y"
          />
        </label>

        <div className="mb-4">
          <TaskComments
            workspaceId={workspaceId}
            taskId={task.id}
            me={me}
            settings={settings}
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded border border-line px-3 py-2.5 text-sm text-ink-muted hover:text-red-300 hover:border-red-400/40"
          >
            {deleting ? "…" : "Delete"}
          </button>
          {onDuplicate && (
            <button
              type="button"
              onClick={() => void handleDuplicate()}
              disabled={duplicating}
              className="rounded border border-line px-3 py-2.5 text-sm text-ink-muted hover:text-ink"
            >
              {duplicating ? "…" : "Duplicate"}
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1 rounded bg-ink py-2.5 text-sm font-medium text-surface hover:bg-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

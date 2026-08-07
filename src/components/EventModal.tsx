"use client";

import { FormEvent, useEffect, useState } from "react";
import type {
  Assignee,
  CalendarEvent,
  CoupleSettings,
  PartnerId,
  RecurRule,
} from "@/lib/types";
import { toDateKey } from "@/lib/types";
import type { NewEventInput } from "@/hooks/useEvents";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: CoupleSettings;
  me: PartnerId;
  event?: CalendarEvent | null;
  defaults?: { startsAt?: string };
  onSubmit: (input: NewEventInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function toLocalInput(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = toDateKey(d);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}

function fromLocal(date: string, time: string): string {
  return new Date(`${date}T${time || "09:00"}:00`).toISOString();
}

export function EventModal({
  open,
  onClose,
  settings,
  me,
  event,
  defaults,
  onSubmit,
  onDelete,
}: Props) {
  const editing = !!event;
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("");
  const [assignee, setAssignee] = useState<Assignee>("both");
  const [notes, setNotes] = useState("");
  const [recur, setRecur] = useState<RecurRule | null>(null);
  const [recurUntil, setRecurUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (event) {
      const start = toLocalInput(event.startsAt);
      setTitle(event.title);
      setDate(start.date);
      setStartTime(start.time);
      setEndTime(event.endsAt ? toLocalInput(event.endsAt).time : "");
      setAssignee(event.assignee);
      setNotes(event.notes ?? "");
      setRecur(event.recur ?? null);
      setRecurUntil(event.recurUntil ?? "");
    } else {
      const base = defaults?.startsAt
        ? new Date(defaults.startsAt)
        : new Date();
      if (!defaults?.startsAt) base.setHours(9, 0, 0, 0);
      const start = toLocalInput(base.toISOString());
      setTitle("");
      setDate(start.date);
      setStartTime(start.time);
      setEndTime("");
      setAssignee("both");
      setNotes("");
      setRecur(null);
      setRecurUntil("");
    }
    setError(null);
  }, [open, event, defaults]);

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
    if (!title.trim() || !date) return;
    setSaving(true);
    setError(null);
    try {
      const startsAt = fromLocal(date, startTime);
      const endsAt = endTime ? fromLocal(date, endTime) : null;
      await onSubmit({
        title: title.trim(),
        startsAt,
        endsAt,
        assignee,
        notes: notes.trim() || undefined,
        createdBy: me,
        recur: recur ?? null,
        recurUntil: recur ? recurUntil || null : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !confirm("Delete this event?")) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
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
          <h2 className="text-base font-semibold">
            {editing ? "Edit event" : "Add event"}
          </h2>
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
            className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="What's happening?"
          />
        </label>

        <div className="mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">Who</span>
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

        <label className="block mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">Date</span>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-accent [color-scheme:dark]"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Starts
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-accent [color-scheme:dark]"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Ends (optional)
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-accent [color-scheme:dark]"
            />
          </label>
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

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded border border-line px-3 py-2.5 text-sm text-ink-muted hover:text-red-300"
            >
              {deleting ? "…" : "Delete"}
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex-1 rounded bg-ink py-2.5 text-sm font-medium text-surface hover:bg-white disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Save" : "Add event"}
          </button>
        </div>
      </form>
    </div>
  );
}

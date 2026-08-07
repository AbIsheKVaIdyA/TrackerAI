"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CalendarEvent, CoupleSettings, PartnerId, Task } from "@/lib/types";
import { assigneeLabel, formatShortDate, formatTime } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  events: CalendarEvent[];
  settings: CoupleSettings;
  me: PartnerId;
  onEditTask: (task: Task) => void;
  onEditEvent: (event: CalendarEvent) => void;
}

export function SearchModal({
  open,
  onClose,
  tasks,
  events,
  settings,
  me,
  onEditTask,
  onEditEvent,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return { tasks: [] as Task[], events: [] as CalendarEvent[] };
    const matchTask = (t: Task) =>
      t.title.toLowerCase().includes(query) ||
      (t.notes?.toLowerCase().includes(query) ?? false);
    const matchEvent = (e: CalendarEvent) =>
      e.title.toLowerCase().includes(query) ||
      (e.notes?.toLowerCase().includes(query) ?? false);
    return {
      tasks: tasks.filter(matchTask).slice(0, 8),
      events: events.filter(matchEvent).slice(0, 6),
    };
  }, [query, tasks, events]);

  if (!open) return null;

  const empty = query && results.tasks.length === 0 && results.events.length === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-3 pt-[12vh] sm:p-4 sm:pt-[14vh]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg border border-line bg-surface-elevated shadow-xl rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <span className="text-ink-dim text-sm">⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks & events…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim"
          />
          <kbd className="hidden sm:inline rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-dim">
            esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {!query && (
            <p className="px-2 py-6 text-center text-sm text-ink-dim">
              Type to find anything on your board or calendar.
            </p>
          )}
          {empty && (
            <p className="px-2 py-6 text-center text-sm text-ink-dim">
              No matches for “{q.trim()}”
            </p>
          )}

          {results.tasks.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-ink-dim">
                Tasks
              </p>
              <ul>
                {results.tasks.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditTask(t);
                      }}
                      className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-surface-hover"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-ink">{t.title}</span>
                        <span className="text-[11px] text-ink-dim">
                          {assigneeLabel(t.assignee, settings, me)}
                          {t.dueDate ? ` · ${formatShortDate(t.dueDate)}` : ""}
                          {t.status === "done" ? " · done" : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.events.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-ink-dim">
                Events
              </p>
              <ul>
                {results.events.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditEvent(e);
                      }}
                      className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-surface-hover"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-ink">{e.title}</span>
                        <span className="text-[11px] text-ink-dim">
                          {formatShortDate(e.startsAt)} · {formatTime(e.startsAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/tasks");
              }}
              className="mt-1 w-full rounded-lg px-2 py-2 text-left text-xs text-ink-dim hover:bg-surface-hover hover:text-ink"
            >
              Open tasks board →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

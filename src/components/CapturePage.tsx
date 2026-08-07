"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  addDays,
  partnerName,
  toDateKey,
  todayKey,
  type Assignee,
  type Category,
  type CoupleSettings,
  type PartnerId,
  type Priority,
  type RecurRule,
} from "@/lib/types";
import {
  CAPTURE_TEMPLATES,
  parseSmartCapture,
} from "@/lib/smart-capture";
import { aiClient } from "@/lib/ai/client";
import type { AiCaptureItem, AiCaptureResult } from "@/lib/ai/types";
import type { NewTaskInput } from "@/hooks/useTasks";
import type { NewEventInput } from "@/hooks/useEvents";

type Mode = "task" | "event";

interface Props {
  settings: CoupleSettings;
  me: PartnerId;
  hasPartner?: boolean;
  initialMode?: Mode;
  eventDefaults?: { startsAt?: string };
  onAddTask: (input: NewTaskInput) => Promise<unknown>;
  onAddEvent: (input: NewEventInput) => Promise<unknown>;
}

function tomorrowKey() {
  return toDateKey(addDays(new Date(), 1));
}

function defaultEventParts(startsAt?: string) {
  const d = startsAt ? new Date(startsAt) : new Date();
  if (!startsAt) d.setHours(19, 0, 0, 0);
  return {
    date: toDateKey(d),
    time: `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`,
  };
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-dim">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
        active
          ? accent
            ? "bg-accent text-surface"
            : "bg-ink text-surface"
          : "border border-line text-ink-muted hover:border-accent/50 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function CapturePage({
  settings,
  me,
  hasPartner = true,
  initialMode = "task",
  eventDefaults,
  onAddTask,
  onAddEvent,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState<Assignee>("both");
  const [dueChip, setDueChip] = useState<"none" | "today" | "tomorrow" | "pick">(
    "today"
  );
  const [dueDate, setDueDate] = useState(todayKey());
  const [eventDate, setEventDate] = useState(todayKey());
  const [eventTime, setEventTime] = useState("19:00");
  const [endTime, setEndTime] = useState("");
  const [recur, setRecur] = useState<RecurRule | null>(null);
  const [category, setCategory] = useState<Category>("other");
  const [priority, setPriority] = useState<Priority>("normal");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [sessionAdds, setSessionAdds] = useState(0);
  const [aiResult, setAiResult] = useState<AiCaptureResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiApplying, setAiApplying] = useState(false);
  const manualRef = useRef({
    mode: false,
    when: false,
    assignee: false,
    category: false,
  });

  useEffect(() => {
    const parts = defaultEventParts(eventDefaults?.startsAt);
    setMode(initialMode);
    setAssignee("both");
    setDueChip(initialMode === "task" ? "today" : "none");
    setDueDate(todayKey());
    setEventDate(parts.date);
    setEventTime(parts.time);
    setEndTime("");
    setRecur(null);
    setCategory("other");
    setPriority("normal");
    setNotes("");
    setError(null);
    manualRef.current = {
      mode: false,
      when: false,
      assignee: false,
      category: false,
    };
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [initialMode, eventDefaults?.startsAt]);

  function applySmartHints(raw: string) {
    const hints = parseSmartCapture(raw);
    if (!manualRef.current.mode && hints.mode) setMode(hints.mode);
    if (!manualRef.current.assignee && hints.assignee) setAssignee(hints.assignee);
    if (!manualRef.current.category && hints.category) setCategory(hints.category);
    if (!manualRef.current.when) {
      if (hints.dueChip) setDueChip(hints.dueChip);
      if (hints.dueDate) setDueDate(hints.dueDate);
      if (hints.eventDate) setEventDate(hints.eventDate);
      if (hints.eventTime) setEventTime(hints.eventTime);
    }
  }

  function applyItemToForm(item: AiCaptureItem) {
    setMode(item.kind);
    setTitle(item.title);
    setAssignee(item.assignee);
    setCategory(item.category);
    setPriority(item.priority);
    setNotes(item.notes?.trim() || "");
    if (item.kind === "task") {
      if (item.dueDate) {
        const t = todayKey();
        const tm = tomorrowKey();
        if (item.dueDate === t) setDueChip("today");
        else if (item.dueDate === tm) setDueChip("tomorrow");
        else {
          setDueChip("pick");
          setDueDate(item.dueDate);
        }
      } else {
        setDueChip("none");
      }
    } else {
      if (item.eventDate) setEventDate(item.eventDate);
      if (item.eventTime) setEventTime(item.eventTime);
      if (item.endTime) setEndTime(item.endTime);
    }
    manualRef.current = {
      mode: true,
      when: true,
      assignee: true,
      category: true,
    };
    setAiResult(null);
  }

  async function createFromItem(item: AiCaptureItem) {
    if (item.kind === "task") {
      await onAddTask({
        title: item.title.trim(),
        category: item.category,
        priority: item.priority,
        dueDate: item.dueDate ?? null,
        notes: item.notes?.trim() || undefined,
        assignee: item.assignee,
        createdBy: me,
        recur: null,
        recurUntil: null,
      });
    } else {
      const date = item.eventDate || todayKey();
      const time = item.eventTime || "19:00";
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      const endsAt = item.endTime
        ? new Date(`${date}T${item.endTime}:00`).toISOString()
        : null;
      await onAddEvent({
        title: item.title.trim(),
        startsAt,
        endsAt,
        notes: item.notes?.trim() || undefined,
        assignee: item.assignee,
        createdBy: me,
        recur: null,
        recurUntil: null,
      });
    }
  }

  async function askAi() {
    if (!title.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const r = await aiClient.capture({
        text: title.trim(),
        partnerAName: settings.partnerAName,
        partnerBName: settings.partnerBName,
        me,
      });
      setAiResult(r);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI unavailable");
      setAiResult(null);
    } finally {
      setAiLoading(false);
    }
  }

  async function addAllAiItems() {
    if (!aiResult?.items.length || aiApplying) return;
    setAiApplying(true);
    setAiError(null);
    try {
      for (const item of aiResult.items) {
        await createFromItem(item);
      }
      setSessionAdds((n) => n + aiResult.items.length);
      setAiResult(null);
      setTitle("");
      setNotes("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 520);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Could not add items");
    } finally {
      setAiApplying(false);
    }
  }

  async function save(andStay: boolean) {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === "task") {
        let due: string | null = null;
        if (dueChip === "today") due = todayKey();
        else if (dueChip === "tomorrow") due = tomorrowKey();
        else if (dueChip === "pick") due = dueDate || null;
        await onAddTask({
          title: title.trim(),
          category,
          priority,
          dueDate: due,
          notes: notes.trim() || undefined,
          assignee,
          createdBy: me,
          recur: recur ?? null,
          recurUntil: null,
        });
      } else {
        const startsAt = new Date(
          `${eventDate}T${eventTime || "19:00"}:00`
        ).toISOString();
        const endsAt = endTime
          ? new Date(`${eventDate}T${endTime}:00`).toISOString()
          : null;
        await onAddEvent({
          title: title.trim(),
          startsAt,
          endsAt,
          notes: notes.trim() || undefined,
          assignee,
          createdBy: me,
          recur: recur ?? null,
          recurUntil: null,
        });
      }
      setSessionAdds((n) => n + 1);
      setSavedFlash(true);
      setTitle("");
      setNotes("");
      manualRef.current = {
        mode: false,
        when: false,
        assignee: false,
        category: false,
      };
      setTimeout(() => {
        setSavedFlash(false);
        if (andStay) {
          inputRef.current?.focus();
        } else {
          router.push(mode === "event" ? "/calendar" : "/tasks");
        }
      }, 520);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void save(true);
  }

  const other: PartnerId = me === "a" ? "b" : "a";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">
      {sessionAdds > 0 && (
        <p className="text-center text-sm text-accent-strong animate-sheet-in">
          {sessionAdds === 1
            ? "Nice. First one in."
            : `${sessionAdds} added this session. Keep going.`}
        </p>
      )}

      {/* Templates */}
      <ChipRow label="Quick start">
        {CAPTURE_TEMPLATES.map((tpl) => (
          <Chip
            key={tpl.id}
            active={false}
            onClick={() => {
              setTitle(tpl.title);
              setMode(tpl.mode);
              setAssignee(tpl.assignee);
              if (tpl.mode === "task") {
                setDueChip(tpl.dueChip);
                if (tpl.dueChip === "today") setDueDate(todayKey());
                if (tpl.dueChip === "tomorrow") setDueDate(tomorrowKey());
                setCategory(tpl.category);
                if ("priority" in tpl && tpl.priority) setPriority(tpl.priority);
              } else {
                setEventDate(
                  toDateKey(addDays(new Date(), 1))
                );
                setEventTime(tpl.eventTime ?? "19:00");
                setCategory(tpl.category);
              }
              manualRef.current = {
                mode: true,
                when: true,
                assignee: true,
                category: true,
              };
              inputRef.current?.focus();
            }}
          >
            {tpl.label}
          </Chip>
        ))}
        <Chip active={false} onClick={() => router.push("/lists")}>
          Shared list →
        </Chip>
      </ChipRow>

      {/* 1) Type */}
      <ChipRow label="What are you adding?">
        <Chip
          active={mode === "task"}
          onClick={() => {
            manualRef.current.mode = true;
            setMode("task");
          }}
          accent
        >
          Do · Task
        </Chip>
        <Chip
          active={mode === "event"}
          onClick={() => {
            manualRef.current.mode = true;
            setMode("event");
          }}
          accent
        >
          Plan · Event
        </Chip>
      </ChipRow>

      {/* 2) Title: primary input */}
      <section className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-dim">
          {mode === "task" ? "What needs doing?" : "What's the plan?"}
        </p>
        <textarea
          ref={inputRef}
          value={title}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            applySmartHints(v);
          }}
          onBlur={() => applySmartHints(title)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void save(true);
            }
          }}
          placeholder={
            mode === "task"
              ? "e.g. Buy groceries tomorrow"
              : "e.g. Dinner together Friday 7pm"
          }
          rows={3}
          className="w-full resize-none rounded-2xl border border-line bg-surface-elevated px-4 py-4 font-display text-2xl sm:text-3xl leading-snug tracking-tight text-ink placeholder:text-ink-dim/60 outline-none focus:border-accent caret-accent"
          autoComplete="off"
        />
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] text-ink-dim flex-1 min-w-[12rem]">
            Tip: try “tomorrow dinner 7pm”, or ask AI for multi-item capture.
          </p>
          <button
            type="button"
            disabled={aiLoading || title.trim().length < 3}
            onClick={() => void askAi()}
            className="rounded-full border border-accent/40 bg-accent-dim/50 px-3.5 py-1.5 text-xs font-medium text-accent-strong disabled:opacity-40"
          >
            {aiLoading ? "Thinking…" : "Ask AI"}
          </button>
        </div>
        {aiError && <p className="text-xs text-red-400">{aiError}</p>}
        {aiResult && (
          <div className="rounded-2xl border border-accent/30 bg-accent-dim/30 px-3.5 py-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-accent">
                  AI proposal
                </p>
                <p className="mt-1 text-sm text-ink-muted">{aiResult.summary}</p>
              </div>
              <button
                type="button"
                onClick={() => setAiResult(null)}
                className="text-[11px] text-ink-dim hover:text-ink"
              >
                Dismiss
              </button>
            </div>
            <ul className="space-y-2">
              {aiResult.items.map((item, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-line/70 bg-surface/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink">
                      <span className="text-ink-dim">
                        {item.kind === "event" ? "Event" : "Task"} ·{" "}
                      </span>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-ink-dim">
                      {item.assignee === "both"
                        ? "Together"
                        : partnerName(item.assignee, settings)}
                      {item.kind === "task" && item.dueDate
                        ? ` · due ${item.dueDate}`
                        : ""}
                      {item.kind === "event" && item.eventDate
                        ? ` · ${item.eventDate}${
                            item.eventTime ? ` ${item.eventTime}` : ""
                          }`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => applyItemToForm(item)}
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-muted hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={aiApplying}
                      onClick={async () => {
                        setAiApplying(true);
                        try {
                          await createFromItem(item);
                          setSessionAdds((n) => n + 1);
                          setAiResult((prev) => {
                            if (!prev) return null;
                            const items = prev.items.filter((_, j) => j !== i);
                            return items.length ? { ...prev, items } : null;
                          });
                        } catch (err) {
                          setAiError(
                            err instanceof Error ? err.message : "Failed"
                          );
                        } finally {
                          setAiApplying(false);
                        }
                      }}
                      className="rounded-full bg-ink px-2.5 py-1 text-[11px] text-surface disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {aiResult.items.length > 1 && (
              <button
                type="button"
                disabled={aiApplying}
                onClick={() => void addAllAiItems()}
                className="w-full rounded-full bg-accent px-3 py-2 text-xs font-medium text-surface disabled:opacity-40"
              >
                {aiApplying ? "Adding…" : "Add all"}
              </button>
            )}
            <p className="text-[10px] text-ink-dim">
              Nothing is saved until you confirm.
            </p>
          </div>
        )}
      </section>

      {/* 3) Who */}
      <ChipRow label="Who is this for?">
        <Chip
          active={assignee === me}
          onClick={() => {
            manualRef.current.assignee = true;
            setAssignee(me);
          }}
        >
          Mine ({me === "a" ? settings.partnerAName : settings.partnerBName})
        </Chip>
        {hasPartner && (
          <>
            <Chip
              active={assignee === other}
              onClick={() => {
                manualRef.current.assignee = true;
                setAssignee(other);
              }}
            >
              Yours (
              {other === "a" ? settings.partnerAName : settings.partnerBName})
            </Chip>
            <Chip
              active={assignee === "both"}
              onClick={() => {
                manualRef.current.assignee = true;
                setAssignee("both");
              }}
            >
              Together
            </Chip>
          </>
        )}
      </ChipRow>

      {/* 4) When */}
      {mode === "task" ? (
        <ChipRow label="When is it due?">
          <Chip
            active={dueChip === "today"}
            onClick={() => {
              manualRef.current.when = true;
              setDueChip("today");
            }}
            accent
          >
            Today
          </Chip>
          <Chip
            active={dueChip === "tomorrow"}
            onClick={() => {
              manualRef.current.when = true;
              setDueChip("tomorrow");
            }}
            accent
          >
            Tomorrow
          </Chip>
          <Chip
            active={dueChip === "none"}
            onClick={() => {
              manualRef.current.when = true;
              setDueChip("none");
            }}
            accent
          >
            Someday
          </Chip>
          <Chip
            active={dueChip === "pick"}
            onClick={() => {
              manualRef.current.when = true;
              setDueChip("pick");
            }}
            accent
          >
            Pick a date
          </Chip>
          {dueChip === "pick" && (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                manualRef.current.when = true;
                setDueDate(e.target.value);
              }}
              className="rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-medium text-black outline-none [color-scheme:light] min-h-[44px]"
            />
          )}
        </ChipRow>
      ) : (
        <section className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-dim">
            When does it happen?
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-dim">Date</span>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => {
                  manualRef.current.when = true;
                  setEventDate(e.target.value);
                }}
                className="rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-medium text-black outline-none [color-scheme:light] min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-dim">Starts</span>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => {
                  manualRef.current.when = true;
                  setEventTime(e.target.value);
                }}
                className="rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-medium text-black outline-none [color-scheme:light] min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-dim">Ends (optional)</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-full border border-line bg-surface-elevated px-4 py-2.5 text-sm font-medium text-ink outline-none [color-scheme:dark] min-h-[44px]"
              />
            </label>
          </div>
        </section>
      )}

      <ChipRow label="Repeats">
        <Chip active={recur === null} onClick={() => setRecur(null)}>
          Once
        </Chip>
        <Chip active={recur === "weekly"} onClick={() => setRecur("weekly")}>
          Weekly
        </Chip>
        <Chip active={recur === "daily"} onClick={() => setRecur("daily")}>
          Daily
        </Chip>
      </ChipRow>

      {/* 5) Task-only extras */}
      {mode === "task" && (
        <>
          <ChipRow label="Category">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.value}
                active={category === c.value}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Chip>
            ))}
          </ChipRow>

          <ChipRow label="Priority">
            <Chip
              active={priority === "normal"}
              onClick={() => setPriority("normal")}
            >
              Normal
            </Chip>
            <Chip
              active={priority === "critical"}
              onClick={() => setPriority("critical")}
              accent
            >
              Important
            </Chip>
          </ChipRow>
        </>
      )}

      {/* 6) Notes */}
      <section className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-dim">
          Notes (optional)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any detail you both should see…"
          className="w-full resize-y rounded-xl border border-line bg-surface-elevated px-3.5 py-3 text-sm text-ink placeholder:text-ink-dim outline-none focus:border-accent"
        />
      </section>

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Actions: part of normal page scroll */}
      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={saving || !title.trim() || savedFlash}
          className={`w-full rounded-full py-4 text-base font-medium transition-all disabled:opacity-40 ${
            savedFlash
              ? "bg-accent text-surface"
              : "bg-ink text-surface hover:bg-white"
          }`}
        >
          {savedFlash
            ? sessionAdds > 1
              ? `Added ✓ · ${sessionAdds} this session`
              : "Added ✓ · add another"
            : saving
              ? "Adding…"
              : mode === "task"
                ? "Add to board"
                : "Add to calendar"}
        </button>
        <button
          type="button"
          disabled={saving || !title.trim() || savedFlash}
          onClick={() => void save(false)}
          className="w-full rounded-full border border-line py-3 text-sm text-ink-muted hover:text-ink disabled:opacity-40"
        >
          Add & go to {mode === "event" ? "calendar" : "tasks"}
        </button>
        <p className="text-center text-[11px] text-ink-dim">
          {settings.partnerAName} & {settings.partnerBName} can both edit · ⌘
          Enter to add
        </p>
      </div>
    </form>
  );
}

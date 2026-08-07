"use client";

import { FormEvent, useMemo, useState, type ClipboardEvent } from "react";
import type { PartnerId } from "@/lib/types";
import {
  type ListItem,
  type ListKind,
  type SharedList,
} from "@/hooks/useLists";

interface Props {
  lists: SharedList[];
  items: ListItem[];
  me: PartnerId;
  needsMigration?: boolean;
  onCreate: (input: { title: string; kind: ListKind }) => Promise<unknown>;
  onDeleteList: (id: string) => Promise<unknown>;
  onAddItem: (listId: string, title: string) => Promise<unknown>;
  onAddItems: (listId: string, titles: string[]) => Promise<unknown>;
  onToggleItem: (id: string, done: boolean) => Promise<unknown>;
  onDeleteItem: (id: string) => Promise<unknown>;
  onClearDone: (listId: string) => Promise<unknown>;
}

const KINDS: { value: ListKind; label: string }[] = [
  { value: "groceries", label: "Groceries" },
  { value: "chores", label: "Chores" },
  { value: "checklist", label: "Checklist" },
  { value: "other", label: "Other" },
];

export function ListsView({
  lists,
  items,
  needsMigration,
  onCreate,
  onDeleteList,
  onAddItem,
  onAddItems,
  onToggleItem,
  onDeleteItem,
  onClearDone,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<ListKind>("groceries");
  const [itemDraft, setItemDraft] = useState("");
  const [creating, setCreating] = useState(false);

  const active = useMemo(() => {
    if (activeId) return lists.find((l) => l.id === activeId) ?? lists[0] ?? null;
    return lists[0] ?? null;
  }, [lists, activeId]);

  const activeItems = useMemo(() => {
    if (!active) return [];
    return items
      .filter((i) => i.listId === active.id)
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return a.sortOrder - b.sortOrder;
      });
  }, [items, active]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    try {
      const list = (await onCreate({
        title: newTitle.trim(),
        kind: newKind,
      })) as SharedList;
      setNewTitle("");
      if (list?.id) setActiveId(list.id);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!active || !itemDraft.trim()) return;
    const raw = itemDraft;
    setItemDraft("");
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length > 1) {
      await onAddItems(active.id, lines);
    } else {
      await onAddItem(active.id, lines[0] ?? raw);
    }
  }

  async function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    if (!active) return;
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n")) return;
    e.preventDefault();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setItemDraft("");
    await onAddItems(active.id, lines);
  }

  if (needsMigration) {
    return (
      <div className="border border-critical/50 bg-critical-dim px-3 py-3 text-sm rounded-task">
        <p className="font-medium text-critical">Lists need a database update</p>
        <p className="mt-1 text-xs text-ink-muted">
          Run{" "}
          <code className="font-mono text-critical">supabase/migrate-slice4.sql</code>{" "}
          in Supabase, then refresh.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Lists</h1>
        <p className="text-sm text-ink-muted">
          Groceries, chores, packing. Both of you can check things off.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New list name…"
          className="min-w-[10rem] flex-1 rounded-full border border-line bg-surface-elevated px-3.5 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value as ListKind)}
          className="rounded-full border border-line bg-surface-elevated px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating || !newTitle.trim()}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface disabled:opacity-40"
        >
          Add list
        </button>
      </form>

      {lists.length === 0 ? (
        <p className="border border-dashed border-line px-3 py-8 text-center text-sm text-ink-dim">
          No lists yet. Start with groceries or a weekend checklist.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-[11rem_1fr]">
          <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1">
            {lists.map((l) => {
              const openCount = items.filter(
                (i) => i.listId === l.id && !i.done
              ).length;
              const selected = active?.id === l.id;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(l.id)}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-left text-sm transition-colors md:w-full ${
                      selected
                        ? "bg-accent-dim text-accent-strong"
                        : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                    }`}
                  >
                    {l.title}
                    <span className="ml-1.5 text-[11px] text-ink-dim">
                      {openCount}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {active && (
            <section className="border border-line rounded-task overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
                <div>
                  <h2 className="text-sm font-semibold text-ink">{active.title}</h2>
                  <p className="text-[11px] capitalize text-ink-dim">
                    {active.kind}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onClearDone(active.id)}
                    className="text-xs text-ink-dim hover:text-ink"
                  >
                    Clear done
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete “${active.title}”?`)) {
                        void onDeleteList(active.id);
                        setActiveId(null);
                      }
                    }}
                    className="text-xs text-ink-dim hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleAddItem}
                className="border-b border-line px-3 py-2.5 space-y-1.5"
              >
                <div className="flex gap-2">
                  <input
                    value={itemDraft}
                    onChange={(e) => setItemDraft(e.target.value)}
                    onPaste={(e) => void handlePaste(e)}
                    placeholder="Add an item… or paste a list"
                    className="flex-1 rounded-full border border-line bg-surface px-3.5 py-2 text-sm outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!itemDraft.trim()}
                    className="rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-surface disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
                <p className="px-1 text-[10px] text-ink-dim">
                  Tip: paste multiple lines (or a bullet list) to add them all.
                </p>
              </form>

              {activeItems.length === 0 ? (
                <p className="px-3.5 py-8 text-center text-sm text-ink-dim">
                  Empty list. Add the first item.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {activeItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-3.5 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => void onToggleItem(item.id, !item.done)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] ${
                          item.done
                            ? "border-accent bg-accent text-surface"
                            : "border-line text-transparent hover:border-accent/50"
                        }`}
                        aria-label={item.done ? "Mark open" : "Mark done"}
                      >
                        ✓
                      </button>
                      <span
                        className={`min-w-0 flex-1 text-sm ${
                          item.done
                            ? "text-ink-dim line-through"
                            : "text-ink"
                        }`}
                      >
                        {item.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => void onDeleteItem(item.id)}
                        className="text-xs text-ink-dim hover:text-ink"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

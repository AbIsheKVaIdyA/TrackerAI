"use client";

import { FormEvent, useState } from "react";
import type { CoupleSettings, PartnerId } from "@/lib/types";
import { partnerName } from "@/lib/types";
import { useTaskComments } from "@/hooks/useTaskComments";
import { relativeTime } from "@/lib/activity";

interface Props {
  workspaceId: string | null | undefined;
  taskId: string;
  me: PartnerId;
  settings: CoupleSettings;
}

export function TaskComments({ workspaceId, taskId, me, settings }: Props) {
  const { comments, loading, unavailable, addComment } = useTaskComments({
    workspaceId,
    taskId,
    me,
    enabled: !!workspaceId,
  });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await addComment(draft);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  if (unavailable) {
    return (
      <p className="text-[11px] text-ink-dim">
        Comments need{" "}
        <code className="font-mono">migrate-slice5.sql</code> in Supabase.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-muted uppercase tracking-wide">
        Thread
      </p>
      <div className="max-h-40 overflow-y-auto space-y-2 rounded border border-line bg-surface px-2.5 py-2">
        {loading && comments.length === 0 && (
          <p className="text-xs text-ink-dim">Loading…</p>
        )}
        {!loading && comments.length === 0 && (
          <p className="text-xs text-ink-dim">
            Leave a note for your partner on this task.
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-medium text-accent-strong">
                {partnerName(c.author, settings)}
                {c.author === me ? " (you)" : ""}
              </span>
              <span className="text-[10px] text-ink-dim">
                {relativeTime(c.createdAt)}
              </span>
            </div>
            <p className="text-ink-muted whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded bg-ink px-3 py-2 text-xs font-medium text-surface disabled:opacity-40"
        >
          Send
        </button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

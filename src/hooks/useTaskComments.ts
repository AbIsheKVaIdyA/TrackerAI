"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import type { PartnerId } from "@/lib/types";

export interface TaskComment {
  id: string;
  workspaceId: string;
  taskId: string;
  author: PartnerId;
  body: string;
  createdAt: string;
}

interface CommentRow {
  id: string;
  workspace_id: string;
  task_id: string;
  author: PartnerId;
  body: string;
  created_at: string;
}

function rowToComment(row: CommentRow): TaskComment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    taskId: row.task_id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function useTaskComments(opts: {
  workspaceId?: string | null;
  taskId?: string | null;
  me?: PartnerId | null;
  enabled?: boolean;
}) {
  const { workspaceId, taskId, me, enabled = true } = opts;
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !workspaceId || !taskId) {
      setComments([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        setUnavailable(true);
        setComments([]);
        return;
      }
      setUnavailable(false);
      setComments(((data as CommentRow[]) ?? []).map(rowToComment));
    } finally {
      setLoading(false);
    }
  }, [enabled, workspaceId, taskId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !workspaceId || !taskId) return;
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        () => void refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, workspaceId, taskId, refresh]);

  const addComment = useCallback(
    async (body: string) => {
      if (!workspaceId || !taskId || !me) throw new Error("Not ready");
      const trimmed = body.trim();
      if (!trimmed) return;
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          workspace_id: workspaceId,
          task_id: taskId,
          author: me,
          body: trimmed,
        })
        .select()
        .single();
      if (error) throw error;
      const comment = rowToComment(data as CommentRow);
      setComments((prev) =>
        prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]
      );
      return comment;
    },
    [workspaceId, taskId, me]
  );

  return {
    comments,
    loading,
    unavailable,
    refresh,
    addComment,
  };
}

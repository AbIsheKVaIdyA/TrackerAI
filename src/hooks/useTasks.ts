"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import { nextDueDate, shouldSpawnNext } from "@/lib/task-utils";
import {
  rowToTask,
  type Assignee,
  type Category,
  type PartnerId,
  type Priority,
  type RecurRule,
  type Status,
  type Task,
  type TaskRow,
} from "@/lib/types";

export interface NewTaskInput {
  title: string;
  category: Category;
  priority: Priority;
  dueDate: string | null;
  notes?: string;
  assignee: Assignee;
  createdBy: PartnerId;
  status?: Status;
  recur?: RecurRule | null;
  recurUntil?: string | null;
}

export function useTasks(opts?: {
  workspaceId?: string | null;
  onLiveChange?: (connected: boolean) => void;
}) {
  const workspaceId = opts?.workspaceId ?? null;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  const onLiveChange = opts?.onLiveChange;

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true });

      if (fetchError) {
        const msg = fetchError.message || "";
        if (
          msg.includes("workspace_id") ||
          msg.includes("due_date") ||
          msg.includes("assignee") ||
          msg.includes("created_by") ||
          msg.includes("schema cache") ||
          msg.includes("column")
        ) {
          setNeedsMigration(true);
        }
        throw fetchError;
      }

      setNeedsMigration(false);
      const rows = (data as TaskRow[]) ?? [];
      setTasks(rows.map(rowToTask));
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load tasks";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!workspaceId) return;
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`tandem-tasks-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as TaskRow;
            if (row.workspace_id && row.workspace_id !== workspaceId) return;
            const task = rowToTask(row);
            setTasks((prev) =>
              prev.some((t) => t.id === task.id) ? prev : [...prev, task]
            );
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as TaskRow;
            if (row.workspace_id && row.workspace_id !== workspaceId) return;
            const task = rowToTask(row);
            setTasks((prev) =>
              prev.map((t) => (t.id === task.id ? task : t))
            );
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: string };
            if (old.id) {
              setTasks((prev) => prev.filter((t) => t.id !== old.id));
            }
          }
        }
      )
      .subscribe((status) => {
        onLiveChange?.(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      onLiveChange?.(false);
    };
  }, [onLiveChange, workspaceId]);

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      if (!workspaceId) throw new Error("No workspace");
      const supabase = createBrowserSupabase();
      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          title: input.title,
          category: input.category,
          priority: input.priority,
          status: input.status ?? "todo",
          due_date: input.dueDate,
          week_assigned: null,
          notes: input.notes || null,
          assignee: input.assignee,
          created_by: input.createdBy,
          workspace_id: workspaceId,
          recur: input.recur ?? null,
          recur_until: input.recurUntil ?? null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      const task = rowToTask(data as TaskRow);
      setTasks((prev) =>
        prev.some((t) => t.id === task.id) ? prev : [...prev, task]
      );
      return task;
    },
    [workspaceId]
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      const current = tasksRef.current.find((t) => t.id === id);
      const supabase = createBrowserSupabase();
      const row: Record<string, unknown> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.category !== undefined) row.category = patch.category;
      if (patch.priority !== undefined) row.priority = patch.priority;
      if (patch.status !== undefined) {
        row.status = patch.status;
        if (patch.status === "done") {
          row.completed_at = patch.completedAt ?? new Date().toISOString();
        } else if (patch.completedAt === undefined) {
          row.completed_at = null;
        }
      }
      if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
      if (patch.notes !== undefined) row.notes = patch.notes ?? null;
      if (patch.assignee !== undefined) row.assignee = patch.assignee;
      if (patch.recur !== undefined) row.recur = patch.recur ?? null;
      if (patch.recurUntil !== undefined) row.recur_until = patch.recurUntil ?? null;
      if (patch.pinned !== undefined) row.pinned = patch.pinned;
      if (patch.completedAt !== undefined && patch.status === undefined) {
        row.completed_at = patch.completedAt ?? null;
      }

      const { data, error: updateError } = await supabase
        .from("tasks")
        .update(row)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      const updated = rowToTask(data as TaskRow);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

      // Spawn next occurrence when a recurring task is completed
      const becameDone =
        patch.status === "done" && current && current.status !== "done";
      const recur = patch.recur !== undefined ? patch.recur : current?.recur;
      if (becameDone && current && recur) {
        const withRecur = { ...current, ...patch, recur } as Task;
        const nextDue = nextDueDate(withRecur.dueDate, recur);
        if (shouldSpawnNext(withRecur, nextDue) && workspaceId) {
          const { data: spawned, error: spawnError } = await supabase
            .from("tasks")
            .insert({
              title: withRecur.title,
              category: withRecur.category,
              priority: withRecur.priority,
              status: "todo",
              due_date: nextDue,
              week_assigned: null,
              notes: withRecur.notes || null,
              assignee: withRecur.assignee,
              created_by: withRecur.createdBy,
              workspace_id: workspaceId,
              recur,
              recur_until: withRecur.recurUntil ?? null,
            })
            .select()
            .single();
          if (!spawnError && spawned) {
            const nextTask = rowToTask(spawned as TaskRow);
            setTasks((prev) =>
              prev.some((t) => t.id === nextTask.id)
                ? prev
                : [...prev, nextTask]
            );
          }
        }
      }

      return updated;
    },
    [workspaceId]
  );

  const cycleStatus = useCallback(
    async (task: Task) => {
      let next: Status;
      if (task.status === "blocked") next = "todo";
      else if (task.status === "todo") next = "in_progress";
      else if (task.status === "in_progress") next = "done";
      else next = "todo";

      return updateTask(task.id, {
        status: next,
        completedAt: next === "done" ? new Date().toISOString() : undefined,
      });
    },
    [updateTask]
  );

  const setBlocked = useCallback(
    async (task: Task, reason: string) => {
      return updateTask(task.id, {
        status: "blocked",
        notes: reason,
        completedAt: undefined,
      });
    },
    [updateTask]
  );

  const setAssignee = useCallback(
    async (id: string, assignee: Assignee) => {
      return updateTask(id, { assignee });
    },
    [updateTask]
  );

  const setDueDate = useCallback(
    async (id: string, dueDate: string | null) => {
      return updateTask(id, { dueDate });
    },
    [updateTask]
  );

  const setPinned = useCallback(
    async (id: string, pinned: boolean) => {
      return updateTask(id, { pinned });
    },
    [updateTask]
  );

  const deleteTask = useCallback(async (id: string) => {
    const supabase = createBrowserSupabase();
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const duplicateTask = useCallback(
    async (task: Task) => {
      return addTask({
        title: task.title,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        notes: task.notes,
        assignee: task.assignee,
        createdBy: task.createdBy,
        status: "todo",
        recur: task.recur ?? null,
        recurUntil: task.recurUntil ?? null,
      });
    },
    [addTask]
  );

  return {
    tasks,
    loading,
    error,
    needsMigration,
    refresh,
    addTask,
    updateTask,
    cycleStatus,
    setBlocked,
    setAssignee,
    setDueDate,
    setPinned,
    deleteTask,
    duplicateTask,
  };
}

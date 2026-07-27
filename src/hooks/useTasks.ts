"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import { SEED_TASKS } from "@/lib/seed-data";
import {
  rowToTask,
  type Assignee,
  type Category,
  type PartnerId,
  type Priority,
  type Status,
  type Task,
  type TaskRow,
  type WeekNumber,
} from "@/lib/types";

export interface NewTaskInput {
  title: string;
  category: Category;
  priority: Priority;
  weekAssigned: WeekNumber | null;
  notes?: string;
  assignee: Assignee;
  createdBy: PartnerId;
}

export function useTasks(opts?: {
  onLiveChange?: (connected: boolean) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const seededRef = useRef(false);
  const onLiveChange = opts?.onLiveChange;

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true });

      if (fetchError) {
        const msg = fetchError.message || "";
        if (
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
      let rows = (data as TaskRow[]) ?? [];

      if (rows.length === 0 && !seededRef.current) {
        seededRef.current = true;
        const payload = SEED_TASKS.map((t) => ({
          title: t.title,
          category: t.category,
          priority: t.priority,
          status: t.status ?? "todo",
          week_assigned: t.weekAssigned,
          completed_at: t.status === "done" ? new Date().toISOString() : null,
          assignee: "a" as const,
          created_by: "a" as const,
        }));

        const { error: seedError } = await supabase.from("tasks").insert(payload);
        if (seedError) throw seedError;

        const { data: seededData, error: refetchError } = await supabase
          .from("tasks")
          .select("*")
          .order("priority", { ascending: true })
          .order("created_at", { ascending: true });

        if (refetchError) throw refetchError;
        rows = (seededData as TaskRow[]) ?? [];
      }

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
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live sync — both partners see updates instantly
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("couple-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const task = rowToTask(payload.new as TaskRow);
            setTasks((prev) =>
              prev.some((t) => t.id === task.id) ? prev : [...prev, task]
            );
          } else if (payload.eventType === "UPDATE") {
            const task = rowToTask(payload.new as TaskRow);
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
        const connected = status === "SUBSCRIBED";
        onLiveChange?.(connected);
      });

    return () => {
      supabase.removeChannel(channel);
      onLiveChange?.(false);
    };
  }, [onLiveChange]);

  const addTask = useCallback(async (input: NewTaskInput) => {
    const supabase = createBrowserSupabase();
    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert({
        title: input.title,
        category: input.category,
        priority: input.priority,
        status: "todo",
        week_assigned: input.weekAssigned,
        notes: input.notes || null,
        assignee: input.assignee,
        created_by: input.createdBy,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    const task = rowToTask(data as TaskRow);
    setTasks((prev) =>
      prev.some((t) => t.id === task.id) ? prev : [...prev, task]
    );
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
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
    if (patch.weekAssigned !== undefined) row.week_assigned = patch.weekAssigned;
    if (patch.notes !== undefined) row.notes = patch.notes ?? null;
    if (patch.assignee !== undefined) row.assignee = patch.assignee;
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
    return updated;
  }, []);

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

  const assignWeek = useCallback(
    async (id: string, week: WeekNumber | null) => {
      return updateTask(id, { weekAssigned: week });
    },
    [updateTask]
  );

  const setAssignee = useCallback(
    async (id: string, assignee: Assignee) => {
      return updateTask(id, { assignee });
    },
    [updateTask]
  );

  const pushToNextWeek = useCallback(
    async (task: Task) => {
      if (!task.weekAssigned || task.weekAssigned >= 5) return;
      const next = (task.weekAssigned + 1) as WeekNumber;
      return updateTask(task.id, { weekAssigned: next });
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
    assignWeek,
    setAssignee,
    pushToNextWeek,
    deleteTask,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import {
  rowToEvent,
  type Assignee,
  type CalendarEvent,
  type EventRow,
  type PartnerId,
  type RecurRule,
} from "@/lib/types";

export interface NewEventInput {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  assignee: Assignee;
  notes?: string;
  createdBy: PartnerId;
  recur?: RecurRule | null;
  recurUntil?: string | null;
}

export function useEvents(opts?: {
  workspaceId?: string | null;
  onLiveChange?: (connected: boolean) => void;
}) {
  const workspaceId = opts?.workspaceId ?? null;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const onLiveChange = opts?.onLiveChange;

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { data, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("starts_at", { ascending: true });

      if (fetchError) {
        const msg = fetchError.message || "";
        if (
          msg.includes("events") ||
          msg.includes("workspace_id") ||
          msg.includes("schema cache") ||
          msg.includes("relation") ||
          msg.includes("does not exist") ||
          msg.includes("PGRST205")
        ) {
          setNeedsMigration(true);
          setEvents([]);
          setError(msg);
          return;
        }
        throw fetchError;
      }

      setNeedsMigration(false);
      const rows = (data as EventRow[]) ?? [];
      setEvents(rows.map(rowToEvent));
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load events";
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
      .channel(`tandem-events-${workspaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as EventRow;
            if (row.workspace_id && row.workspace_id !== workspaceId) return;
            const event = rowToEvent(row);
            setEvents((prev) =>
              prev.some((e) => e.id === event.id) ? prev : [...prev, event]
            );
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as EventRow;
            if (row.workspace_id && row.workspace_id !== workspaceId) return;
            const event = rowToEvent(row);
            setEvents((prev) =>
              prev.map((e) => (e.id === event.id ? event : e))
            );
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id?: string };
            if (old.id) {
              setEvents((prev) => prev.filter((e) => e.id !== old.id));
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

  const addEvent = useCallback(
    async (input: NewEventInput) => {
      if (!workspaceId) throw new Error("No workspace");
      const supabase = createBrowserSupabase();
      const { data, error: insertError } = await supabase
        .from("events")
        .insert({
          title: input.title,
          starts_at: input.startsAt,
          ends_at: input.endsAt || null,
          assignee: input.assignee,
          notes: input.notes || null,
          created_by: input.createdBy,
          workspace_id: workspaceId,
          recur: input.recur ?? null,
          recur_until: input.recurUntil ?? null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      const event = rowToEvent(data as EventRow);
      setEvents((prev) =>
        prev.some((e) => e.id === event.id) ? prev : [...prev, event]
      );
      return event;
    },
    [workspaceId]
  );

  const updateEvent = useCallback(
    async (id: string, patch: Partial<CalendarEvent>) => {
      const supabase = createBrowserSupabase();
      const row: Record<string, unknown> = {};
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.startsAt !== undefined) row.starts_at = patch.startsAt;
      if (patch.endsAt !== undefined) row.ends_at = patch.endsAt ?? null;
      if (patch.assignee !== undefined) row.assignee = patch.assignee;
      if (patch.notes !== undefined) row.notes = patch.notes ?? null;
      if (patch.recur !== undefined) row.recur = patch.recur ?? null;
      if (patch.recurUntil !== undefined) row.recur_until = patch.recurUntil ?? null;

      const { data, error: updateError } = await supabase
        .from("events")
        .update(row)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      const updated = rowToEvent(data as EventRow);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    []
  );

  const deleteEvent = useCallback(async (id: string) => {
    const supabase = createBrowserSupabase();
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    events,
    loading,
    error,
    needsMigration,
    refresh,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}

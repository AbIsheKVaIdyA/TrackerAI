"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import {
  rowToPing,
  type PartnerId,
  type PartnerPing,
  type PartnerPingRow,
} from "@/lib/types";

export function usePings(opts: {
  workspaceId?: string | null;
  me?: PartnerId | null;
}) {
  const { workspaceId, me } = opts;
  const [pings, setPings] = useState<PartnerPing[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!workspaceId || !me) {
      setPings([]);
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("partner_pings")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("to_partner", me)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        // Table may not exist yet: quiet fail
        setPings([]);
        return;
      }
      setPings(((data as PartnerPingRow[]) ?? []).map(rowToPing));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, me]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!workspaceId || !me) return;
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`pings-${workspaceId}-${me}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_pings" },
        () => {
          void refresh();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, me, refresh]);

  const sendPing = useCallback(
    async (input: {
      toPartner: PartnerId;
      message: string;
      taskId?: string;
    }) => {
      if (!workspaceId || !me) throw new Error("Not in a workspace");
      const supabase = createBrowserSupabase();
      const { error } = await supabase.from("partner_pings").insert({
        workspace_id: workspaceId,
        task_id: input.taskId ?? null,
        from_partner: me,
        to_partner: input.toPartner,
        message: input.message.trim() || "Needs a hand",
      });
      if (error) throw error;
    },
    [workspaceId, me]
  );

  const markRead = useCallback(async (id: string) => {
    const supabase = createBrowserSupabase();
    await supabase
      .from("partner_pings")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setPings((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!workspaceId || !me) return;
    const supabase = createBrowserSupabase();
    await supabase
      .from("partner_pings")
      .update({ read_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("to_partner", me)
      .is("read_at", null);
    setPings([]);
  }, [workspaceId, me]);

  return {
    pings,
    loading,
    unreadCount: pings.length,
    refresh,
    sendPing,
    markRead,
    markAllRead,
  };
}

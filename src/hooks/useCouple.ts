"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import {
  clearWorkspaceSession,
  getStoredFilter,
  setStoredFilter,
  setStoredIdentity,
  setStoredWorkspaceId,
  workspaceToSettings,
  type WorkspaceRow,
} from "@/lib/couple";
import {
  DEFAULT_COUPLE,
  type CoupleSettings,
  type PartnerId,
  type PersonFilter,
  type Workspace,
} from "@/lib/types";
import type { MembershipPayload } from "@/lib/workspace-api";

const FILTERS: PersonFilter[] = [
  "all",
  "mine",
  "yours",
  "together",
  "a",
  "b",
  "both",
];

function applyMembership(
  m: MembershipPayload,
  setters: {
    setMe: (id: PartnerId) => void;
    setWorkspaceId: (id: string) => void;
    setWorkspace: (w: Workspace) => void;
    setSettings: (s: CoupleSettings) => void;
    setMemberCount: (n: number) => void;
  }
) {
  setters.setMe(m.partnerId);
  setters.setWorkspaceId(m.workspace.id);
  setters.setWorkspace(m.workspace);
  setters.setSettings(m.settings);
  setters.setMemberCount(m.memberCount ?? 1);
  setStoredWorkspaceId(m.workspace.id);
  setStoredIdentity(m.partnerId);
}

export function useCouple() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [me, setMe] = useState<PartnerId | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<CoupleSettings>(DEFAULT_COUPLE);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [needsWorkspaceMigration, setNeedsWorkspaceMigration] = useState(false);
  const [filter, setFilterState] = useState<PersonFilter>("all");
  const [live, setLive] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    const storedFilter = getStoredFilter();
    if (FILTERS.includes(storedFilter as PersonFilter)) {
      if (storedFilter === "both") {
        setFilterState("together");
        setStoredFilter("together");
      } else if (storedFilter === "a" || storedFilter === "b") {
        setFilterState("all");
        setStoredFilter("all");
      } else {
        setFilterState(storedFilter as PersonFilter);
      }
    }
  }, []);

  const hydrate = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      clearWorkspaceSession();
      setMe(null);
      setWorkspaceId(null);
      setWorkspace(null);
      setMemberCount(0);
      setSettings(DEFAULT_COUPLE);
      setReady(true);
      return;
    }

    try {
      const res = await fetch("/api/workspace/me");
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsWorkspaceMigration(true);
        setSettingsError(data.error || "Migration required");
        setMe(null);
        setWorkspaceId(null);
        setWorkspace(null);
        setMemberCount(0);
        setReady(true);
        return;
      }
      if (!res.ok) {
        setSettingsError(data.error || "Could not load membership");
        setReady(true);
        return;
      }

      setNeedsWorkspaceMigration(false);
      setSettingsError(null);

      if (!data.membership) {
        clearWorkspaceSession();
        setMe(null);
        setWorkspaceId(null);
        setWorkspace(null);
        setMemberCount(0);
        setSettings(DEFAULT_COUPLE);
        setReady(true);
        return;
      }

      applyMembership(data.membership as MembershipPayload, {
        setMe,
        setWorkspaceId,
        setWorkspace,
        setSettings,
        setMemberCount,
      });
      setReady(true);
    } catch (e) {
      setSettingsError(e instanceof Error ? e.message : "Hydration failed");
      setReady(true);
    }
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const loadWorkspace = useCallback(async (id: string) => {
    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        const msg = error.message || "";
        if (
          msg.includes("workspaces") ||
          msg.includes("schema cache") ||
          msg.includes("PGRST205") ||
          msg.includes("does not exist")
        ) {
          setNeedsWorkspaceMigration(true);
        }
        setSettingsError(msg);
        return null;
      }
      setNeedsWorkspaceMigration(false);
      setSettingsError(null);
      if (!data) return null;
      const row = data as WorkspaceRow;
      const ws = {
        id: row.id,
        name: row.name,
        inviteCode: row.invite_code,
        partnerAName: row.partner_a_name,
        partnerBName: row.partner_b_name,
        showFairness: !!row.show_fairness,
      };
      setWorkspace(ws);
      setSettings(workspaceToSettings(row));
      return ws;
    } catch (e) {
      setSettingsError(e instanceof Error ? e.message : "Workspace load failed");
      return null;
    }
  }, []);

  const createWorkspace = useCallback(
    async (input: {
      mode: "solo" | "couple";
      name?: string;
      partnerAName?: string;
      partnerBName?: string;
    }) => {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: input.mode,
          name: input.name,
          myName: input.partnerAName,
          partnerName: input.partnerBName,
        }),
      });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsWorkspaceMigration(true);
        throw new Error(data.error || "Run migrate-auth.sql");
      }
      if (!res.ok) throw new Error(data.error || "Could not create workspace");

      const m = data.membership as MembershipPayload;
      applyMembership(m, {
        setMe,
        setWorkspaceId,
        setWorkspace,
        setSettings,
        setMemberCount,
      });
      setNeedsWorkspaceMigration(false);
      return m.workspace;
    },
    []
  );

  const joinWorkspace = useCallback(async (code: string) => {
    const res = await fetch("/api/workspace/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.needsMigration) {
      setNeedsWorkspaceMigration(true);
      throw new Error(data.error || "Run migrate-auth.sql");
    }
    if (!res.ok) throw new Error(data.error || "Could not join");

    const m = data.membership as MembershipPayload;
    applyMembership(m, {
      setMe,
      setWorkspaceId,
      setWorkspace,
      setSettings,
      setMemberCount,
    });
    setNeedsWorkspaceMigration(false);
    return m.workspace;
  }, []);

  const leaveWorkspace = useCallback(async () => {
    try {
      await fetch("/api/workspace/leave", { method: "POST" });
    } catch {
      // still clear local
    }
    clearWorkspaceSession();
    setMe(null);
    setWorkspaceId(null);
    setWorkspace(null);
    setMemberCount(0);
    setSettings(DEFAULT_COUPLE);
  }, []);

  const deleteWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    const supabase = createBrowserSupabase();
    await supabase.from("tasks").delete().eq("workspace_id", workspaceId);
    await supabase.from("events").delete().eq("workspace_id", workspaceId);
    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);
    if (error) throw error;
    await leaveWorkspace();
  }, [workspaceId, leaveWorkspace]);

  const hasPartner = memberCount >= 2;

  const setFilter = useCallback(
    (f: PersonFilter) => {
      // Solo spaces: no Yours / Together filters
      if (
        memberCount < 2 &&
        (f === "yours" || f === "together" || f === "both")
      ) {
        setFilterState("all");
        setStoredFilter("all");
        return;
      }
      setFilterState(f);
      setStoredFilter(f);
    },
    [memberCount]
  );

  useEffect(() => {
    if (
      memberCount > 0 &&
      memberCount < 2 &&
      (filter === "yours" || filter === "together" || filter === "both")
    ) {
      setFilterState("all");
      setStoredFilter("all");
    }
  }, [memberCount, filter]);

  const saveSettings = useCallback(
    async (next: CoupleSettings) => {
      if (!workspaceId) throw new Error("No workspace");
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("workspaces")
        .update({
          name: next.coupleLabel.trim() || "Tandem",
          partner_a_name: next.partnerAName.trim() || "Partner A",
          partner_b_name: next.partnerBName.trim() || "Partner B",
        })
        .eq("id", workspaceId)
        .select()
        .single();
      if (error) throw error;
      const row = data as WorkspaceRow;
      const ws = {
        id: row.id,
        name: row.name,
        inviteCode: row.invite_code,
        partnerAName: row.partner_a_name,
        partnerBName: row.partner_b_name,
        showFairness: !!row.show_fairness,
      };
      setWorkspace(ws);
      setSettings(workspaceToSettings(row));
    },
    [workspaceId]
  );

  const setShowFairness = useCallback(
    async (show: boolean) => {
      if (!workspaceId) throw new Error("No workspace");
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("workspaces")
        .update({ show_fairness: show })
        .eq("id", workspaceId)
        .select()
        .single();
      if (error) throw error;
      const row = data as WorkspaceRow;
      setWorkspace({
        id: row.id,
        name: row.name,
        inviteCode: row.invite_code,
        partnerAName: row.partner_a_name,
        partnerBName: row.partner_b_name,
        showFairness: !!row.show_fairness,
      });
    },
    [workspaceId]
  );

  return {
    me,
    ready: ready && isLoaded,
    workspaceId,
    workspace,
    settings,
    settingsError,
    needsWorkspaceMigration,
    filter,
    setFilter,
    live,
    setLive,
    memberCount,
    hasPartner,
    createWorkspace,
    joinWorkspace,
    leaveWorkspace,
    deleteWorkspace,
    logout: leaveWorkspace,
    saveSettings,
    setShowFairness,
    reloadSettings: () =>
      workspaceId ? loadWorkspace(workspaceId) : Promise.resolve(null),
    refreshMembership: hydrate,
  };
}

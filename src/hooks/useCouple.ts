"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import {
  getStoredFilter,
  getStoredIdentity,
  parseCoupleSettings,
  setStoredFilter,
  setStoredIdentity,
} from "@/lib/couple";
import {
  DEFAULT_COUPLE,
  type CoupleSettings,
  type PartnerId,
  type PersonFilter,
} from "@/lib/types";

export function useCouple() {
  const [me, setMe] = useState<PartnerId>("a");
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<CoupleSettings>(DEFAULT_COUPLE);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<PersonFilter>("all");
  const [live, setLive] = useState(false);

  useEffect(() => {
    const stored = getStoredIdentity();
    setMe(stored ?? "a");
    if (!stored) setStoredIdentity("a");

    const storedFilter = getStoredFilter();
    if (
      storedFilter === "all" ||
      storedFilter === "a" ||
      storedFilter === "b" ||
      storedFilter === "both"
    ) {
      setFilterState(storedFilter);
    } else if (storedFilter === "mine") {
      // legacy — same as Abhishek/person filter, default to all
      setFilterState("all");
      setStoredFilter("all");
    }
    setReady(true);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const supabase = createBrowserSupabase();
      const { data, error } = await supabase
        .from("couple_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        setSettingsError(error.message);
        return;
      }
      setSettingsError(null);

      // Ensure Kusa is set if still on old default
      if (
        data &&
        (!data.partner_b_name ||
          data.partner_b_name === "Partner" ||
          data.partner_b_name === "User B")
      ) {
        await supabase
          .from("couple_settings")
          .update({ partner_b_name: "Kusa" })
          .eq("id", 1);
        setSettings(
          parseCoupleSettings({ ...data, partner_b_name: "Kusa" })
        );
        return;
      }

      setSettings(parseCoupleSettings(data));
    } catch (e) {
      setSettingsError(e instanceof Error ? e.message : "Settings load failed");
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadSettings();
  }, [ready, loadSettings]);

  const chooseIdentity = useCallback((id: PartnerId) => {
    setStoredIdentity(id);
    setMe(id);
  }, []);

  const switchIdentity = useCallback(() => {
    setMe((prev) => {
      const next: PartnerId = prev === "a" ? "b" : "a";
      setStoredIdentity(next);
      return next;
    });
  }, []);

  const setFilter = useCallback((f: PersonFilter) => {
    setFilterState(f);
    setStoredFilter(f);
  }, []);

  const saveSettings = useCallback(async (next: CoupleSettings) => {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("couple_settings").upsert({
      id: 1,
      partner_a_name: next.partnerAName.trim() || "Abhishek",
      partner_b_name: next.partnerBName.trim() || "Kusa",
      couple_label: next.coupleLabel.trim() || "August Execution",
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    setSettings({
      partnerAName: next.partnerAName.trim() || "Abhishek",
      partnerBName: next.partnerBName.trim() || "Kusa",
      coupleLabel: next.coupleLabel.trim() || "August Execution",
    });
  }, []);

  return {
    me,
    ready,
    settings,
    settingsError,
    filter,
    setFilter,
    live,
    setLive,
    chooseIdentity,
    switchIdentity,
    saveSettings,
    reloadSettings: loadSettings,
  };
}

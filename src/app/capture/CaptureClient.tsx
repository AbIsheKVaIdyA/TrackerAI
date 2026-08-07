"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CapturePage } from "@/components/CapturePage";

export function CaptureClient() {
  const params = useSearchParams();
  const initialMode = useMemo(() => {
    return params.get("mode") === "event" ? "event" : "task";
  }, [params]);
  const eventDefaults = useMemo(() => {
    const at = params.get("at");
    return at ? { startsAt: at } : undefined;
  }, [params]);

  return (
    <AppShell showFilter={false}>
      {({ settings, me, hasPartner, addTask, addEvent }) => (
        <CapturePage
          settings={settings}
          me={me}
          hasPartner={hasPartner}
          initialMode={initialMode}
          eventDefaults={eventDefaults}
          onAddTask={addTask}
          onAddEvent={addEvent}
        />
      )}
    </AppShell>
  );
}

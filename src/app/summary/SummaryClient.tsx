"use client";

import { AppShell } from "@/components/AppShell";
import { SummaryView } from "@/components/SummaryView";

export function SummaryClient() {
  return (
    <AppShell>
      {({
        visibleTasks,
        settings,
        cycleStatus,
        setBlocked,
        pushToNextWeek,
        assignWeek,
        setAssignee,
      }) => (
        <SummaryView
          tasks={visibleTasks}
          settings={settings}
          onCycleStatus={cycleStatus}
          onSetBlocked={setBlocked}
          onPushNext={pushToNextWeek}
          onAssignWeek={assignWeek}
          onSetAssignee={setAssignee}
        />
      )}
    </AppShell>
  );
}

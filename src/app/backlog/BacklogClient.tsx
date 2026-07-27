"use client";

import { AppShell } from "@/components/AppShell";
import { BacklogView } from "@/components/BacklogView";

export function BacklogClient() {
  return (
    <AppShell>
      {({
        visibleTasks,
        settings,
        cycleStatus,
        setBlocked,
        assignWeek,
        setAssignee,
      }) => (
        <BacklogView
          tasks={visibleTasks}
          settings={settings}
          onCycleStatus={cycleStatus}
          onSetBlocked={setBlocked}
          onAssignWeek={assignWeek}
          onSetAssignee={setAssignee}
        />
      )}
    </AppShell>
  );
}

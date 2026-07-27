"use client";

import { AppShell } from "@/components/AppShell";
import { WeekView } from "@/components/WeekView";

export function WeekClient() {
  return (
    <AppShell>
      {({
        visibleTasks,
        settings,
        cycleStatus,
        setBlocked,
        assignWeek,
        setAssignee,
        pushToNextWeek,
      }) => (
        <WeekView
          tasks={visibleTasks}
          settings={settings}
          onCycleStatus={cycleStatus}
          onSetBlocked={setBlocked}
          onAssignWeek={assignWeek}
          onSetAssignee={setAssignee}
          onPushNext={pushToNextWeek}
        />
      )}
    </AppShell>
  );
}

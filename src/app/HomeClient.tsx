"use client";

import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";

export function HomeClient() {
  return (
    <AppShell>
      {({
        visibleTasks,
        settings,
        me,
        cycleStatus,
        setBlocked,
        assignWeek,
        setAssignee,
      }) => (
        <Dashboard
          tasks={visibleTasks}
          settings={settings}
          me={me}
          onCycleStatus={cycleStatus}
          onSetBlocked={setBlocked}
          onAssignWeek={assignWeek}
          onSetAssignee={setAssignee}
        />
      )}
    </AppShell>
  );
}

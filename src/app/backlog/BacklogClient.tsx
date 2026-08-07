"use client";

import { AppShell } from "@/components/AppShell";
import { BacklogView } from "@/components/BacklogView";

export function BacklogClient() {
  return (
    <AppShell>
      {({
        visibleTasks,
        settings,
        me,
        cycleStatus,
        setBlocked,
        setAssignee,
        setDueDate,
        openEditTask,
        pingPartnerForTask,
        setPinned,
      }) => (
        <BacklogView
          tasks={visibleTasks}
          settings={settings}
          me={me}
          onCycleStatus={cycleStatus}
          onSetBlocked={setBlocked}
          onSetAssignee={setAssignee}
          onSetDueDate={setDueDate}
          onEdit={openEditTask}
          onPingPartner={pingPartnerForTask}
          onSetPinned={setPinned}
        />
      )}
    </AppShell>
  );
}

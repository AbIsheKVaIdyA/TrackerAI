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
        hasPartner,
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
          hasPartner={hasPartner}
          onCycleStatus={cycleStatus}
          onSetBlocked={setBlocked}
          onSetAssignee={setAssignee}
          onSetDueDate={setDueDate}
          onEdit={openEditTask}
          onPingPartner={hasPartner ? pingPartnerForTask : undefined}
          onSetPinned={setPinned}
        />
      )}
    </AppShell>
  );
}

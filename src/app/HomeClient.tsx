"use client";

import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";

export function HomeClient() {
  return (
    <AppShell>
      {({
        visibleTasks,
        visibleEvents,
        settings,
        me,
        workspace,
        pings,
        hasPartner,
        cycleStatus,
        setBlocked,
        setAssignee,
        setDueDate,
        setPinned,
        openEditTask,
        openEditEvent,
        pingPartnerForTask,
        dismissPing,
        setShowFairness,
      }) => (
        <Dashboard
          tasks={visibleTasks}
          events={visibleEvents}
          settings={settings}
          me={me}
          workspace={workspace}
          pings={pings}
          hasPartner={hasPartner}
          onCycleStatus={cycleStatus}
          onSetBlocked={setBlocked}
          onSetAssignee={setAssignee}
          onSetDueDate={setDueDate}
          onSetPinned={setPinned}
          onEditTask={openEditTask}
          onEditEvent={openEditEvent}
          onPingPartner={hasPartner ? pingPartnerForTask : undefined}
          onDismissPing={dismissPing}
          onToggleFairness={setShowFairness}
        />
      )}
    </AppShell>
  );
}

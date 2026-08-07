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
          onCycleStatus={cycleStatus}
          onSetBlocked={setBlocked}
          onSetAssignee={setAssignee}
          onSetDueDate={setDueDate}
          onSetPinned={setPinned}
          onEditTask={openEditTask}
          onEditEvent={openEditEvent}
          onPingPartner={pingPartnerForTask}
          onDismissPing={dismissPing}
          onToggleFairness={setShowFairness}
        />
      )}
    </AppShell>
  );
}

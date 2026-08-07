"use client";

import { AppShell } from "@/components/AppShell";
import { TasksBoard } from "@/components/TasksBoard";

export function TasksClient() {
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
        <TasksBoard
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

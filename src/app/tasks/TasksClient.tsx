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

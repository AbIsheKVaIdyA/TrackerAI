"use client";

import { AppShell } from "@/components/AppShell";
import { WeeklyReview } from "@/components/WeeklyReview";

export function ReviewClient() {
  return (
    <AppShell>
      {({ visibleTasks, visibleEvents, settings, me, addTask }) => (
        <WeeklyReview
          tasks={visibleTasks}
          events={visibleEvents}
          settings={settings}
          me={me}
          onAddTask={addTask}
        />
      )}
    </AppShell>
  );
}

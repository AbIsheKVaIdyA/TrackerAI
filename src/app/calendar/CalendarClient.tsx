"use client";

import { AppShell } from "@/components/AppShell";
import { CalendarView } from "@/components/CalendarView";

export function CalendarClient() {
  return (
    <AppShell>
      {({
        visibleEvents,
        settings,
        me,
        openAddEvent,
        openEditEvent,
      }) => (
        <CalendarView
          events={visibleEvents}
          settings={settings}
          me={me}
          onAdd={openAddEvent}
          onEdit={openEditEvent}
        />
      )}
    </AppShell>
  );
}

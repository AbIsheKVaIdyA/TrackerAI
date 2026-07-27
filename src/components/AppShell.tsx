"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useCouple } from "@/hooks/useCouple";
import { useTasks } from "@/hooks/useTasks";
import { taskVisibleTo, type PartnerId } from "@/lib/types";
import { Nav } from "./Nav";
import { AddTaskModal } from "./AddTaskModal";
import { CoupleSettingsModal } from "./CoupleSettingsModal";
import { PersonFilterBar } from "./PersonFilterBar";

export type AppContext = Omit<ReturnType<typeof useTasks>, never> &
  Omit<ReturnType<typeof useCouple>, "me" | "ready"> & {
    me: PartnerId;
    openAdd: () => void;
    visibleTasks: ReturnType<typeof useTasks>["tasks"];
  };

interface Props {
  children: (ctx: AppContext) => ReactNode;
}

export function AppShell({ children }: Props) {
  const couple = useCouple();
  const setLive = couple.setLive;
  const onLiveChange = useCallback(
    (connected: boolean) => setLive(connected),
    [setLive]
  );
  const tasksApi = useTasks({ onLiveChange });
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const me = couple.me;

  const visibleTasks = useMemo(() => {
    return tasksApi.tasks.filter((t) =>
      taskVisibleTo(t, couple.filter, me)
    );
  }, [tasksApi.tasks, couple.filter, me]);

  if (!couple.ready) {
    return (
      <div className="min-h-screen bg-surface text-ink flex items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Nav
        onAdd={() => setAddOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        onChoose={couple.chooseIdentity}
        settings={couple.settings}
        me={me}
        live={couple.live}
      />
      <main className="mx-auto max-w-6xl px-4 py-5">
        {tasksApi.needsMigration && (
          <div className="mb-4 border border-critical/50 bg-critical-dim px-3 py-2.5 text-sm">
            <p className="font-medium text-critical">Database update required</p>
            <p className="mt-1 text-xs text-ink-muted">
              In Supabase → SQL Editor, run{" "}
              <code className="font-mono text-critical">
                supabase/migrate-couple.sql
              </code>
              , then refresh.
            </p>
          </div>
        )}

        {tasksApi.loading && (
          <p className="text-sm text-ink-muted">Loading tasks…</p>
        )}
        {tasksApi.error && !tasksApi.needsMigration && (
          <div className="mb-4 border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            <p className="font-medium">Could not load tasks</p>
            <p className="mt-1 text-xs text-red-300/80">{tasksApi.error}</p>
          </div>
        )}

        {!tasksApi.loading && !tasksApi.error && (
          <>
            <PersonFilterBar
              settings={couple.settings}
              me={me}
              filter={couple.filter}
              onChange={couple.setFilter}
            />
            {children({
              ...tasksApi,
              ...couple,
              me,
              openAdd: () => setAddOpen(true),
              visibleTasks,
            })}
          </>
        )}

        {!tasksApi.loading && tasksApi.needsMigration && (
          <p className="text-sm text-ink-muted">
            Waiting for migration… existing tasks stay safe until you run the SQL.
          </p>
        )}
      </main>

      <AddTaskModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        settings={couple.settings}
        me={me}
        onSubmit={async (input) => {
          await tasksApi.addTask(input);
        }}
      />
      <CoupleSettingsModal
        open={settingsOpen}
        settings={couple.settings}
        onClose={() => setSettingsOpen(false)}
        onSave={couple.saveSettings}
      />
    </div>
  );
}

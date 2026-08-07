"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCouple } from "@/hooks/useCouple";
import { useTasks } from "@/hooks/useTasks";
import { useEvents } from "@/hooks/useEvents";
import { usePings } from "@/hooks/usePings";
import { taskVisibleTo, type PartnerId, type Status } from "@/lib/types";
import { Nav } from "./Nav";
import { WorkspaceEntry } from "./WorkspaceEntry";
import { EditTaskModal } from "./EditTaskModal";
import { EventModal } from "./EventModal";
import { CoupleSettingsModal } from "./CoupleSettingsModal";
import { PersonFilterBar } from "./PersonFilterBar";
import { SearchModal } from "./SearchModal";
import { UndoToast } from "./UndoToast";
import type { CalendarEvent, Task } from "@/lib/types";

export type AppContext = Omit<ReturnType<typeof useTasks>, never> &
  Omit<ReturnType<typeof useEvents>, "loading" | "error" | "needsMigration" | "refresh"> & {
    eventsLoading: boolean;
    eventsError: string | null;
    eventsNeedsMigration: boolean;
    refreshEvents: () => Promise<void>;
  } &
  Omit<ReturnType<typeof useCouple>, "me" | "ready"> & {
    me: PartnerId;
    openAdd: () => void;
    openAddEvent: (defaults?: { startsAt?: string }) => void;
    openEditTask: (task: Task) => void;
    openEditEvent: (event: CalendarEvent) => void;
    visibleTasks: ReturnType<typeof useTasks>["tasks"];
    visibleEvents: ReturnType<typeof useEvents>["events"];
    pings: ReturnType<typeof usePings>["pings"];
    pingPartnerForTask: (task: Task) => Promise<void>;
    dismissPing: (id: string) => Promise<void>;
  };

interface Props {
  children: (ctx: AppContext) => ReactNode;
  showFilter?: boolean;
}

export function AppShell({ children, showFilter = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isCapture = pathname.startsWith("/capture");
  const isEnter = pathname.startsWith("/enter");
  const couple = useCouple();
  const setLive = couple.setLive;
  const onLiveChange = useCallback(
    (connected: boolean) => {
      if (connected) setLive(true);
    },
    [setLive]
  );
  const tasksApi = useTasks({
    workspaceId: couple.workspaceId,
    onLiveChange,
  });
  const eventsApi = useEvents({
    workspaceId: couple.workspaceId,
    onLiveChange,
  });
  const pingsApi = usePings({
    workspaceId: couple.workspaceId,
    me: couple.me,
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [undo, setUndo] = useState<{
    taskId: string;
    prevStatus: Status;
    title: string;
  } | null>(null);

  const me = couple.me;
  const cycleStatusBase = tasksApi.cycleStatus;
  const updateTaskBase = tasksApi.updateTask;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sendPing = pingsApi.sendPing;
  const pingPartnerForTask = useCallback(
    async (task: Task) => {
      if (!me) return;
      const to: PartnerId = me === "a" ? "b" : "a";
      await sendPing({
        toPartner: to,
        message: `Needs help: ${task.title}`,
        taskId: task.id,
      });
    },
    [me, sendPing]
  );

  const cycleStatusWithUndo = useCallback(
    async (task: Task) => {
      const prev = task.status;
      const updated = await cycleStatusBase(task);
      if (prev !== "done" && updated.status === "done") {
        setUndo({
          taskId: task.id,
          prevStatus: prev,
          title: task.title,
        });
      }
      return updated;
    },
    [cycleStatusBase]
  );

  const dismissUndo = useCallback(() => setUndo(null), []);

  const handleUndo = useCallback(async () => {
    if (!undo) return;
    await updateTaskBase(undo.taskId, {
      status: undo.prevStatus,
      completedAt: undefined,
    });
    setUndo(null);
  }, [undo, updateTaskBase]);

  const visibleTasks = useMemo(() => {
    if (!me) return [];
    return tasksApi.tasks.filter((t) => taskVisibleTo(t, couple.filter, me));
  }, [tasksApi.tasks, couple.filter, me]);

  const visibleEvents = useMemo(() => {
    if (!me) return [];
    return eventsApi.events.filter((e) =>
      taskVisibleTo(e, couple.filter, me)
    );
  }, [eventsApi.events, couple.filter, me]);

  if (!couple.ready) {
    return (
      <div className="min-h-screen bg-surface text-ink flex items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!couple.workspaceId || !me) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-surface text-ink flex items-center justify-center text-sm text-ink-muted">
            Loading…
          </div>
        }
      >
        <WorkspaceEntry
          settings={couple.settings}
          workspace={couple.workspace}
          needsMigration={couple.needsWorkspaceMigration}
          onCreate={couple.createWorkspace}
          onJoin={couple.joinWorkspace}
          onEnter={() => {
            router.replace(isEnter ? "/home" : "/home");
          }}
          onLeave={() => {
            void couple.leaveWorkspace();
            router.replace("/");
          }}
        />
      </Suspense>
    );
  }

  const needsMigration =
    couple.needsWorkspaceMigration ||
    tasksApi.needsMigration ||
    eventsApi.needsMigration;

  const showPage = isCapture || (!tasksApi.loading && !tasksApi.error);
  const showLoading =
    !isCapture && (tasksApi.loading || eventsApi.loading);

  function openAdd() {
    router.push("/capture");
  }

  function openAddEvent(defaults?: { startsAt?: string }) {
    if (defaults?.startsAt) {
      router.push(
        `/capture?mode=event&at=${encodeURIComponent(defaults.startsAt)}`
      );
      return;
    }
    router.push("/capture?mode=event");
  }

  const ctx: AppContext = {
    ...tasksApi,
    cycleStatus: cycleStatusWithUndo,
    events: eventsApi.events,
    addEvent: eventsApi.addEvent,
    updateEvent: eventsApi.updateEvent,
    deleteEvent: eventsApi.deleteEvent,
    eventsLoading: eventsApi.loading,
    eventsError: eventsApi.error,
    eventsNeedsMigration: eventsApi.needsMigration,
    refreshEvents: eventsApi.refresh,
    ...couple,
    me,
    openAdd,
    openAddEvent,
    openEditTask: setEditTask,
    openEditEvent: setEditEvent,
    visibleTasks,
    visibleEvents,
    pings: pingsApi.pings,
    pingPartnerForTask,
    dismissPing: pingsApi.markRead,
  };

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Nav
        onSettings={() => setSettingsOpen(true)}
        onSearch={() => setSearchOpen(true)}
        onLeaveSpace={() => {
          void couple.leaveWorkspace();
          router.replace("/enter");
        }}
        settings={couple.settings}
        me={me}
      />
      <main
        className={`mx-auto px-3 sm:px-4 py-4 sm:py-5 pb-24 md:pb-5 ${
          isCapture ? "max-w-3xl" : "max-w-6xl"
        }`}
      >
        {needsMigration && (
          <div className="mb-4 border border-critical/50 bg-critical-dim px-3 py-2.5 text-sm">
            <p className="font-medium text-critical">Database update required</p>
            <p className="mt-1 text-xs text-ink-muted">
              In Supabase → SQL Editor, run migrations through{" "}
              <code className="font-mono text-critical">
                migrate-auth.sql
              </code>{" "}
              (after workspaces + slices). Auth needs{" "}
              <code className="font-mono text-critical">
                workspace_members
              </code>
              .
              , then{" "}
              <code className="font-mono text-critical">
                migrate-slice5.sql
              </code>
              , then{" "}
              <code className="font-mono text-critical">
                migrate-slice6.sql
              </code>{" "}
              for pins. Hard-refresh after.
            </p>
            {(tasksApi.error || eventsApi.error || couple.settingsError) && (
              <p className="mt-1.5 text-[11px] text-ink-dim break-all">
                {tasksApi.error || eventsApi.error || couple.settingsError}
              </p>
            )}
          </div>
        )}

        {showLoading && (
          <p className="text-sm text-ink-muted">Loading…</p>
        )}
        {tasksApi.error && !tasksApi.needsMigration && !isCapture && (
          <div className="mb-4 border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
            <p className="font-medium">Could not load tasks</p>
            <p className="mt-1 text-xs text-red-300/80">{tasksApi.error}</p>
          </div>
        )}

        {(showPage || (!tasksApi.loading && !tasksApi.error)) && (
          <>
            {showFilter && !isCapture && (
              <PersonFilterBar
                filter={couple.filter}
                onChange={couple.setFilter}
              />
            )}
            {children(ctx)}
          </>
        )}
      </main>

      <EditTaskModal
        open={!!editTask}
        task={editTask}
        settings={couple.settings}
        me={me}
        workspaceId={couple.workspaceId}
        onClose={() => setEditTask(null)}
        onSave={async (id, patch) => {
          await tasksApi.updateTask(id, patch);
        }}
        onDelete={async (id) => {
          await tasksApi.deleteTask(id);
        }}
        onDuplicate={async (task) => {
          const copy = await tasksApi.duplicateTask(task);
          setEditTask(copy);
        }}
        onSendPing={async (message, taskId) => {
          if (!me) return;
          const to: PartnerId = me === "a" ? "b" : "a";
          await sendPing({
            toPartner: to,
            message,
            taskId,
          });
        }}
      />

      <EventModal
        open={!!editEvent}
        event={editEvent}
        settings={couple.settings}
        me={me}
        onClose={() => setEditEvent(null)}
        onSubmit={async (input) => {
          if (!editEvent) return;
          await eventsApi.updateEvent(editEvent.id, {
            title: input.title,
            startsAt: input.startsAt,
            endsAt: input.endsAt ?? undefined,
            assignee: input.assignee,
            notes: input.notes,
            recur: input.recur ?? null,
            recurUntil: input.recurUntil ?? null,
          });
        }}
        onDelete={
          editEvent
            ? async () => {
                await eventsApi.deleteEvent(editEvent.id);
              }
            : undefined
        }
      />

      <CoupleSettingsModal
        open={settingsOpen}
        settings={couple.settings}
        workspace={couple.workspace}
        onClose={() => setSettingsOpen(false)}
        onSave={couple.saveSettings}
        onToggleFairness={couple.setShowFairness}
        onLeave={() => {
          void couple.leaveWorkspace();
          router.replace("/enter");
        }}
        onDelete={async () => {
          await couple.deleteWorkspace();
          router.replace("/");
        }}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        tasks={tasksApi.tasks}
        events={eventsApi.events}
        settings={couple.settings}
        me={me}
        onEditTask={setEditTask}
        onEditEvent={setEditEvent}
      />

      {undo && (
        <UndoToast
          message={`Done: ${undo.title}`}
          onUndo={() => void handleUndo()}
          onDismiss={dismissUndo}
        />
      )}
    </div>
  );
}

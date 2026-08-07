"use client";

import type { Assignee, CoupleSettings, PartnerId, Task } from "@/lib/types";
import { TaskRow } from "./TaskRow";

interface Props {
  tasks: Task[];
  settings: CoupleSettings;
  me: PartnerId;
  hasPartner?: boolean;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onSetAssignee: (id: string, assignee: Assignee) => Promise<unknown>;
  onSetDueDate: (id: string, dueDate: string | null) => Promise<unknown>;
  onEdit: (task: Task) => void;
  onPingPartner?: (task: Task) => Promise<unknown>;
  onSetPinned?: (id: string, pinned: boolean) => Promise<unknown>;
}

export function BacklogView({
  tasks,
  settings,
  me,
  hasPartner = true,
  onCycleStatus,
  onSetBlocked,
  onSetAssignee,
  onSetDueDate,
  onEdit,
  onPingPartner,
  onSetPinned,
}: Props) {
  const backlog = tasks.filter((t) => !t.dueDate && t.status !== "done");

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl tracking-tight text-ink">
          Backlog
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          No due date yet · {backlog.length} parked
        </p>
      </div>

      {backlog.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-3 py-10 text-center text-sm text-ink-dim">
          Backlog is empty.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line/90 bg-surface-elevated/80 divide-y divide-line/70">
          {backlog.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              settings={settings}
              me={me}
              hasPartner={hasPartner}
              onCycleStatus={onCycleStatus}
              onSetBlocked={onSetBlocked}
              onSetAssignee={onSetAssignee}
              onSetDueDate={onSetDueDate}
              onEdit={onEdit}
              onPingPartner={onPingPartner}
              onSetPinned={onSetPinned}
            />
          ))}
        </div>
      )}
    </div>
  );
}

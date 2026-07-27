"use client";

import type { Assignee, CoupleSettings, Task, WeekNumber } from "@/lib/types";
import { TaskRow } from "./TaskRow";

interface Props {
  tasks: Task[];
  settings: CoupleSettings;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onAssignWeek: (id: string, week: WeekNumber | null) => Promise<unknown>;
  onSetAssignee: (id: string, assignee: Assignee) => Promise<unknown>;
}

export function BacklogView({
  tasks,
  settings,
  onCycleStatus,
  onSetBlocked,
  onAssignWeek,
  onSetAssignee,
}: Props) {
  const backlog = tasks.filter((t) => t.weekAssigned == null);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Backlog</h1>
        <p className="text-sm text-ink-muted">
          Unscheduled tasks — assign a week or reassign ownership.
        </p>
      </div>

      {backlog.length === 0 ? (
        <p className="border border-dashed border-line px-3 py-8 text-center text-sm text-ink-dim">
          Backlog is empty. New tasks without a week land here.
        </p>
      ) : (
        <div className="divide-y divide-line-subtle border border-line bg-surface-elevated/50">
          {backlog.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              settings={settings}
              onCycleStatus={onCycleStatus}
              onSetBlocked={onSetBlocked}
              onAssignWeek={onAssignWeek}
              onSetAssignee={onSetAssignee}
              showWeek
            />
          ))}
        </div>
      )}
    </div>
  );
}

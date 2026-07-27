"use client";

import type { Assignee, Category, CoupleSettings, Task, WeekNumber } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { TaskRow } from "./TaskRow";

interface Props {
  tasks: Task[];
  settings: CoupleSettings;
  onCycleStatus: (task: Task) => Promise<unknown>;
  onSetBlocked: (task: Task, reason: string) => Promise<unknown>;
  onAssignWeek?: (id: string, week: WeekNumber | null) => Promise<unknown>;
  onSetAssignee?: (id: string, assignee: Assignee) => Promise<unknown>;
  onPushNext?: (task: Task) => Promise<unknown>;
  showWeek?: boolean;
  emptyLabel?: string;
}

export function TaskGroupList({
  tasks,
  settings,
  onCycleStatus,
  onSetBlocked,
  onAssignWeek,
  onSetAssignee,
  onPushNext,
  showWeek,
  emptyLabel = "No tasks",
}: Props) {
  if (tasks.length === 0) {
    return <p className="px-2 py-4 text-sm text-ink-dim">{emptyLabel}</p>;
  }

  const byCategory = new Map<Category, Task[]>();
  for (const cat of CATEGORIES) byCategory.set(cat.value, []);
  for (const t of tasks) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  for (const cat of CATEGORIES) {
    const list = byCategory.get(cat.value);
    if (!list) continue;
    list.sort((a: Task, b: Task) => {
      if (a.priority !== b.priority) {
        return a.priority === "critical" ? -1 : 1;
      }
      const order: Record<Task["status"], number> = {
        blocked: 0,
        in_progress: 1,
        todo: 2,
        done: 3,
      };
      return order[a.status] - order[b.status];
    });
  }

  return (
    <div className="space-y-3">
      {CATEGORIES.map((cat) => {
        const list = byCategory.get(cat.value) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={cat.value}>
            <h3 className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-ink-dim">
              {cat.label}
              <span className="ml-1.5 text-ink-dim/60">{list.length}</span>
            </h3>
            <div className="divide-y divide-line-subtle border border-line-subtle bg-surface-elevated/50">
              {list.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  settings={settings}
                  onCycleStatus={onCycleStatus}
                  onSetBlocked={onSetBlocked}
                  onAssignWeek={onAssignWeek}
                  onSetAssignee={onSetAssignee}
                  onPushNext={onPushNext}
                  showWeek={showWeek}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

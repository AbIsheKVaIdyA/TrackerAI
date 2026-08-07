import {
  partnerName,
  type CoupleSettings,
  type PartnerId,
  type Task,
} from "./types";

export type ActivityKind = "done" | "blocked" | "added" | "progress";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  at: string;
  by: PartnerId;
  label: string;
}

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

/** Derive a light activity feed from task timestamps (last ~72h). */
export function buildActivityFeed(
  tasks: Task[],
  settings: CoupleSettings,
  limit = 8
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const t of tasks) {
    if (t.completedAt && hoursAgo(t.completedAt) <= 72) {
      const by = t.assignee === "both" ? t.createdBy : t.assignee;
      items.push({
        id: `done-${t.id}`,
        kind: "done",
        title: t.title,
        at: t.completedAt,
        by,
        label: `${partnerName(by, settings)} finished`,
      });
      continue;
    }

    if (t.status === "blocked" && t.updatedAt && hoursAgo(t.updatedAt) <= 72) {
      items.push({
        id: `blocked-${t.id}`,
        kind: "blocked",
        title: t.title,
        at: t.updatedAt,
        by: t.assignee === "both" ? t.createdBy : t.assignee,
        label: "Needs help",
      });
      continue;
    }

    if (
      t.status === "in_progress" &&
      t.updatedAt &&
      hoursAgo(t.updatedAt) <= 48
    ) {
      const by = t.assignee === "both" ? t.createdBy : t.assignee;
      items.push({
        id: `progress-${t.id}`,
        kind: "progress",
        title: t.title,
        at: t.updatedAt,
        by,
        label: `${partnerName(by, settings)} working on`,
      });
      continue;
    }

    if (hoursAgo(t.createdAt) <= 72) {
      items.push({
        id: `added-${t.id}`,
        kind: "added",
        title: t.title,
        at: t.createdAt,
        by: t.createdBy,
        label: `${partnerName(t.createdBy, settings)} added`,
      });
    }
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export type Priority = "critical" | "normal";
export type Status = "todo" | "in_progress" | "blocked" | "done";
export type Category =
  | "career_applications"
  | "certifications_learning"
  | "startup_business"
  | "admin_finance"
  | "personal_social"
  | "other";

export type WeekNumber = 1 | 2 | 3 | 4 | 5;

/** Partner identity keys shared across devices */
export type PartnerId = "a" | "b";
/** Who a task is assigned to */
export type Assignee = PartnerId | "both";
export type PersonFilter = "all" | PartnerId | "both";

export interface CoupleSettings {
  partnerAName: string;
  partnerBName: string;
  coupleLabel: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  weekAssigned: WeekNumber | null;
  notes?: string;
  assignee: Assignee;
  createdBy: PartnerId;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

/** Raw row shape from Supabase (snake_case) */
export interface TaskRow {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  week_assigned: number | null;
  notes: string | null;
  assignee: Assignee | null;
  created_by: PartnerId | null;
  created_at: string;
  completed_at: string | null;
  updated_at?: string | null;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "career_applications", label: "Career & Applications" },
  { value: "certifications_learning", label: "Certifications & Learning" },
  { value: "startup_business", label: "Startup & Business" },
  { value: "admin_finance", label: "Admin & Finance" },
  { value: "personal_social", label: "Personal & Social" },
  { value: "other", label: "Other" },
];

export const DEFAULT_COUPLE: CoupleSettings = {
  partnerAName: "Abhishek",
  partnerBName: "Kusa",
  coupleLabel: "August Execution",
};

export const STATUS_CYCLE: Status[] = ["todo", "in_progress", "done"];

export function categoryLabel(category: Category): string {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function partnerName(
  id: PartnerId,
  settings: CoupleSettings
): string {
  return id === "a" ? settings.partnerAName : settings.partnerBName;
}

export function assigneeLabel(
  assignee: Assignee,
  settings: CoupleSettings
): string {
  if (assignee === "both") return "Shared";
  return partnerName(assignee, settings);
}

export function taskVisibleTo(
  task: Task,
  filter: PersonFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "both") return task.assignee === "both";
  return task.assignee === filter || task.assignee === "both";
}

export function progressFor(
  tasks: Task[],
  who: PartnerId | "all"
): { done: number; total: number; percent: number } {
  const list =
    who === "all"
      ? tasks
      : tasks.filter((t) => t.assignee === who || t.assignee === "both");
  const done = list.filter((t) => t.status === "done").length;
  const total = list.length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : (done / total) * 100,
  };
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    status: row.status,
    weekAssigned: (row.week_assigned as WeekNumber | null) ?? null,
    notes: row.notes ?? undefined,
    assignee: row.assignee ?? "a",
    createdBy: row.created_by ?? "a",
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

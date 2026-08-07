export type Priority = "critical" | "normal";
export type Status = "todo" | "in_progress" | "blocked" | "done";
export type Category =
  | "work"
  | "home"
  | "health"
  | "money"
  | "social"
  | "other"
  // legacy (read-only until migration)
  | "career_applications"
  | "certifications_learning"
  | "startup_business"
  | "admin_finance"
  | "personal_social";

export type PartnerId = "a" | "b";
export type Assignee = PartnerId | "both";
/** Relative filters use mine/yours; absolute use a/b/both */
export type PersonFilter = "all" | "mine" | "yours" | "together" | PartnerId | "both";

export interface CoupleSettings {
  partnerAName: string;
  partnerBName: string;
  coupleLabel: string;
}

export interface Workspace {
  id: string;
  name: string;
  inviteCode: string;
  partnerAName: string;
  partnerBName: string;
  showFairness: boolean;
}

export type RecurRule = "daily" | "weekly";

export interface PartnerPing {
  id: string;
  workspaceId: string;
  taskId?: string;
  fromPartner: PartnerId;
  toPartner: PartnerId;
  message: string;
  readAt?: string;
  createdAt: string;
}

export interface PartnerPingRow {
  id: string;
  workspace_id: string;
  task_id: string | null;
  from_partner: PartnerId;
  to_partner: PartnerId;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  dueDate: string | null;
  weekAssigned: number | null;
  notes?: string;
  assignee: Assignee;
  createdBy: PartnerId;
  workspaceId?: string;
  recur?: RecurRule | null;
  recurUntil?: string | null;
  pinned?: boolean;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface TaskRow {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: Status;
  due_date?: string | null;
  week_assigned?: number | null;
  notes: string | null;
  assignee: Assignee | null;
  created_by: PartnerId | null;
  workspace_id?: string | null;
  recur?: RecurRule | null;
  recur_until?: string | null;
  pinned?: boolean | null;
  created_at: string;
  completed_at: string | null;
  updated_at?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  assignee: Assignee;
  notes?: string;
  createdBy: PartnerId;
  workspaceId?: string;
  recur?: RecurRule | null;
  recurUntil?: string | null;
  /** Set when expanded from a recurring series for display */
  occurrenceOf?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EventRow {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  assignee: Assignee | null;
  notes: string | null;
  created_by: PartnerId | null;
  workspace_id?: string | null;
  recur?: RecurRule | null;
  recur_until?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "home", label: "Home" },
  { value: "health", label: "Health" },
  { value: "money", label: "Money" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

export const DEFAULT_COUPLE: CoupleSettings = {
  partnerAName: "Partner A",
  partnerBName: "Partner B",
  coupleLabel: "Tandem",
};

export function categoryLabel(category: Category): string {
  return CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export function partnerName(id: PartnerId, settings: CoupleSettings): string {
  return id === "a" ? settings.partnerAName : settings.partnerBName;
}

export function relativeAssigneeLabel(
  assignee: Assignee,
  me: PartnerId
): string {
  if (assignee === "both") return "Together";
  if (assignee === me) return "Mine";
  return "Yours";
}

export function assigneeLabel(
  assignee: Assignee,
  settings: CoupleSettings,
  me?: PartnerId | null
): string {
  if (me) return relativeAssigneeLabel(assignee, me);
  if (assignee === "both") return "Together";
  return partnerName(assignee, settings);
}

export function taskVisibleTo(
  task: { assignee: Assignee },
  filter: PersonFilter,
  me?: PartnerId | null
): boolean {
  if (filter === "all") return true;
  if (filter === "together" || filter === "both") return task.assignee === "both";
  if (filter === "mine") {
    if (!me) return true;
    return task.assignee === me || task.assignee === "both";
  }
  if (filter === "yours") {
    if (!me) return true;
    const other: PartnerId = me === "a" ? "b" : "a";
    return task.assignee === other || task.assignee === "both";
  }
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

export function normalizeCategory(raw: string): Category {
  const map: Record<string, Category> = {
    career_applications: "work",
    certifications_learning: "work",
    startup_business: "work",
    admin_finance: "money",
    personal_social: "social",
    work: "work",
    home: "home",
    health: "health",
    money: "money",
    social: "social",
    other: "other",
  };
  return map[raw] ?? "other";
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: normalizeCategory(row.category),
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date ?? null,
    weekAssigned: row.week_assigned ?? null,
    notes: row.notes ?? undefined,
    assignee: row.assignee ?? "a",
    createdBy: row.created_by ?? "a",
    workspaceId: row.workspace_id ?? undefined,
    recur: row.recur ?? null,
    recurUntil: row.recur_until ?? null,
    pinned: !!row.pinned,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? undefined,
    assignee: row.assignee ?? "both",
    notes: row.notes ?? undefined,
    createdBy: row.created_by ?? "a",
    workspaceId: row.workspace_id ?? undefined,
    recur: row.recur ?? null,
    recurUntil: row.recur_until ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function rowToPing(row: PartnerPingRow): PartnerPing {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    taskId: row.task_id ?? undefined,
    fromPartner: row.from_partner,
    toPartner: row.to_partner,
    message: row.message,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

/** Local calendar day yyyy-mm-dd */
export function toDateKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  x.setDate(x.getDate() + diff);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function formatShortDate(iso: string): string {
  return new Date(iso.includes("T") ? iso : iso + "T12:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

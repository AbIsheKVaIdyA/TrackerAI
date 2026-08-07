import type { Assignee, Category, Priority } from "@/lib/types";

export type AiCaptureKind = "task" | "event";

export interface AiCaptureItem {
  kind: AiCaptureKind;
  title: string;
  assignee: Assignee;
  category: Category;
  priority: Priority;
  notes?: string | null;
  dueDate?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  endTime?: string | null;
}

export interface AiCaptureResult {
  summary: string;
  items: AiCaptureItem[];
}

export interface AiReviewResult {
  summary: string;
  stuck: string[];
  focus: { title: string; reason: string; assignee: Assignee }[];
}

export interface AiFairnessResult {
  suggestion: string | null;
  rationale: string;
}

export interface AiUnblockResult {
  nextStep: string;
  partnerMessage: string;
}

export interface AiDigestResult {
  lines: string[];
  tone: "morning" | "evening";
}

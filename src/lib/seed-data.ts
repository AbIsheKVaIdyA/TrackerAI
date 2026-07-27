import type { Category, Priority, Status, WeekNumber } from "./types";

export interface SeedTask {
  title: string;
  category: Category;
  priority: Priority;
  weekAssigned: WeekNumber;
  status?: Status;
}

export const SEED_TASKS: SeedTask[] = [
  {
    title: "Submit scholarship requirements",
    category: "career_applications",
    priority: "normal",
    weekAssigned: 3,
  },
  {
    title: "Finish resume & portfolio",
    category: "career_applications",
    priority: "normal",
    weekAssigned: 3,
  },
  {
    title: "Finish application dev & start it up for a startup",
    category: "startup_business",
    priority: "critical",
    weekAssigned: 1,
  },
  {
    title: "Prajwal Joshi YouTube account — post whatever content is ready",
    category: "startup_business",
    priority: "normal",
    weekAssigned: 5,
    status: "done",
  },
  {
    title: "Samarth — items list to bring",
    category: "personal_social",
    priority: "normal",
    weekAssigned: 5,
  },
  {
    title: "TryHackMe certification",
    category: "certifications_learning",
    priority: "critical",
    weekAssigned: 1,
  },
  {
    title: "Search & learn hash/node — get inside LeetCode soon",
    category: "certifications_learning",
    priority: "normal",
    weekAssigned: 4,
  },
  {
    title: "Finish the scholar paper & close it out",
    category: "career_applications",
    priority: "critical",
    weekAssigned: 1,
  },
  {
    title: "Track certificate from VTU, book classes, complete payment",
    category: "admin_finance",
    priority: "normal",
    weekAssigned: 3,
  },
  {
    title:
      "Buy insurance & finalize by dropping mail [verify: 'make it minus by dropping mail']",
    category: "admin_finance",
    priority: "critical",
    weekAssigned: 1,
  },
  {
    title: "Finish up Instagram lists & sort what can be done soon",
    category: "personal_social",
    priority: "critical",
    weekAssigned: 2,
  },
  {
    title: "Payroll email — Chase bank delete issue",
    category: "admin_finance",
    priority: "normal",
    weekAssigned: 5,
  },
  {
    title: "Learn DJ",
    category: "certifications_learning",
    priority: "critical",
    weekAssigned: 2,
  },
  {
    title: "Send cold emails to mama — sent email IDs",
    category: "personal_social",
    priority: "normal",
    weekAssigned: 5,
    status: "done",
  },
  {
    title: "Tesla internship — follow-up email, find someone to get in",
    category: "career_applications",
    priority: "normal",
    weekAssigned: 4,
  },
  {
    title: "Visit Chase bank — credit card connect, account payment status",
    category: "admin_finance",
    priority: "normal",
    weekAssigned: 3,
  },
  {
    title: "Drop emails for TA/RA roles",
    category: "career_applications",
    priority: "normal",
    weekAssigned: 4,
  },
  {
    title: "Company website improvements",
    category: "startup_business",
    priority: "critical",
    weekAssigned: 4,
  },
  {
    title: "Marketing & business decision — start & proceed",
    category: "startup_business",
    priority: "critical",
    weekAssigned: 2,
  },
  {
    title: "[verify] Old project — break/proceed decision",
    category: "other",
    priority: "critical",
    weekAssigned: 2,
  },
  {
    title: "[verify] Telegram bot + notifications setup",
    category: "startup_business",
    priority: "critical",
    weekAssigned: 5,
  },
];

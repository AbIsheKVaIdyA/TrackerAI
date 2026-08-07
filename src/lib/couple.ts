import type { CoupleSettings, PartnerId } from "./types";
import { DEFAULT_COUPLE } from "./types";

const IDENTITY_KEY = "tandem-identity";
const FILTER_KEY = "tandem-filter";
const WORKSPACE_KEY = "tandem-workspace-id";

export function getStoredIdentity(): PartnerId | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(IDENTITY_KEY);
  return v === "a" || v === "b" ? v : null;
}

export function setStoredIdentity(id: PartnerId): void {
  localStorage.setItem(IDENTITY_KEY, id);
}

export function clearStoredIdentity(): void {
  localStorage.removeItem(IDENTITY_KEY);
}

export function getStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WORKSPACE_KEY);
}

export function setStoredWorkspaceId(id: string): void {
  localStorage.setItem(WORKSPACE_KEY, id);
}

export function clearStoredWorkspaceId(): void {
  localStorage.removeItem(WORKSPACE_KEY);
}

export function clearWorkspaceSession(): void {
  clearStoredIdentity();
  clearStoredWorkspaceId();
}

export function getStoredFilter(): string {
  if (typeof window === "undefined") return "all";
  return localStorage.getItem(FILTER_KEY) ?? "all";
}

export function setStoredFilter(filter: string): void {
  localStorage.setItem(FILTER_KEY, filter);
}

export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 8; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

export interface WorkspaceRow {
  id: string;
  name: string;
  invite_code: string;
  partner_a_name: string;
  partner_b_name: string;
  show_fairness?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export function workspaceToSettings(row: WorkspaceRow): CoupleSettings {
  return {
    partnerAName: row.partner_a_name?.trim() || DEFAULT_COUPLE.partnerAName,
    partnerBName: row.partner_b_name?.trim() || DEFAULT_COUPLE.partnerBName,
    coupleLabel: row.name?.trim() || DEFAULT_COUPLE.coupleLabel,
  };
}

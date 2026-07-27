import type { CoupleSettings, PartnerId } from "./types";
import { DEFAULT_COUPLE } from "./types";

const IDENTITY_KEY = "august-tracker-identity";
const FILTER_KEY = "august-tracker-filter";

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

export function getStoredFilter(): string {
  if (typeof window === "undefined") return "all";
  return localStorage.getItem(FILTER_KEY) ?? "all";
}

export function setStoredFilter(filter: string): void {
  localStorage.setItem(FILTER_KEY, filter);
}

export function parseCoupleSettings(row: {
  partner_a_name?: string;
  partner_b_name?: string;
  couple_label?: string;
} | null): CoupleSettings {
  if (!row) return { ...DEFAULT_COUPLE };
  return {
    partnerAName: row.partner_a_name?.trim() || DEFAULT_COUPLE.partnerAName,
    partnerBName: row.partner_b_name?.trim() || DEFAULT_COUPLE.partnerBName,
    coupleLabel: row.couple_label?.trim() || DEFAULT_COUPLE.coupleLabel,
  };
}

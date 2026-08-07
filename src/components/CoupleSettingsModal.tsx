"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { CoupleSettings, Workspace } from "@/lib/types";

interface Props {
  open: boolean;
  settings: CoupleSettings;
  workspace: Workspace | null;
  hasPartner?: boolean;
  onClose: () => void;
  onSave: (next: CoupleSettings) => Promise<void>;
  onToggleFairness?: (show: boolean) => Promise<void>;
  onLeave: () => void;
  onDelete: () => Promise<void>;
}

export function CoupleSettingsModal({
  open,
  settings,
  workspace,
  hasPartner = true,
  onClose,
  onSave,
  onToggleFairness,
  onLeave,
  onDelete,
}: Props) {
  const [partnerAName, setPartnerAName] = useState(settings.partnerAName);
  const [partnerBName, setPartnerBName] = useState(settings.partnerBName);
  const [coupleLabel, setCoupleLabel] = useState(settings.coupleLabel);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setPartnerAName(settings.partnerAName);
      setPartnerBName(settings.partnerBName);
      setCoupleLabel(settings.coupleLabel);
      setError(null);
    }
  }, [open, settings]);

  if (!open) return null;

  const inviteLink =
    typeof window !== "undefined" && workspace
      ? `${window.location.origin}/enter?code=${workspace.inviteCode}`
      : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        partnerAName,
        partnerBName: hasPartner ? partnerBName : partnerAName,
        coupleLabel,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this couple space and all its tasks/events? This cannot be undone."
      )
    ) {
      return;
    }
    if (!confirm("Really delete everything in this space?")) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center bg-black/70 sm:p-4 sm:pt-[12vh]">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md border border-line bg-surface-elevated p-5 rounded-t-xl sm:rounded-none pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[92vh] overflow-y-auto"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        <h2 className="text-base font-semibold mb-1">Workspace</h2>
        <p className="text-xs text-ink-muted mb-4">
          {hasPartner
            ? "Names, invite code, and space controls."
            : "Your space. Invite a partner anytime with the code below."}
        </p>

        {workspace && !hasPartner && (
          <div className="mb-4 rounded-xl border border-accent/35 bg-accent-dim/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-accent">
              Invite partner
            </p>
            <p className="mt-1 font-display text-2xl tracking-[0.18em] text-accent-strong">
              {workspace.inviteCode}
            </p>
            <p className="mt-1 text-[11px] text-ink-dim break-all">{inviteLink}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* ignore */
                }
              }}
              className="mt-2 text-xs text-ink-muted hover:text-ink"
            >
              {copied ? "Link copied" : "Copy invite link"}
            </button>
          </div>
        )}

        <label className="block mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">
            Space name
          </span>
          <input
            value={coupleLabel}
            onChange={(e) => setCoupleLabel(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>

        <div
          className={`grid gap-3 mb-4 ${hasPartner ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              {hasPartner ? "Partner A" : "Your name"}
            </span>
            <input
              required
              value={partnerAName}
              onChange={(e) => setPartnerAName(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          {hasPartner && (
            <label className="block">
              <span className="text-xs text-ink-muted uppercase tracking-wide">
                Partner B
              </span>
              <input
                required
                value={partnerBName}
                onChange={(e) => setPartnerBName(e.target.value)}
                className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          )}
        </div>

        {workspace && hasPartner && (
          <div className="mb-4 rounded-xl border border-line bg-surface px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-dim">
              Invite code
            </p>
            <p className="mt-1 font-display text-2xl tracking-[0.18em] text-accent-strong">
              {workspace.inviteCode}
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* ignore */
                }
              }}
              className="mt-2 text-xs text-ink-muted hover:text-ink"
            >
              {copied ? "Link copied" : "Copy invite link"}
            </button>
          </div>
        )}

        {workspace && hasPartner && onToggleFairness && (
          <label className="mb-4 flex items-start gap-3 rounded-xl border border-line bg-surface px-3 py-3">
            <input
              type="checkbox"
              checked={!!workspace.showFairness}
              onChange={(e) => void onToggleFairness(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm text-ink">Fairness signal</span>
              <span className="mt-0.5 block text-[11px] text-ink-dim">
                Soft open-load bar on Home. Opt-in, not a scoreboard.
              </span>
            </span>
          </label>
        )}

        <div className="mb-4 rounded-xl border border-line bg-surface px-3 py-3 space-y-2">
          <p className="text-sm text-ink">Shortcuts</p>
          <p className="text-[11px] text-ink-dim">
            Search anywhere with ⌘K / Ctrl+K. Shared lists live at{" "}
            <Link href="/lists" className="text-accent-strong hover:underline" onClick={onClose}>
              /lists
            </Link>
            .
          </p>
          <p className="text-[11px] text-ink-dim">
            Install: Safari Share → Add to Home Screen · Chrome → Install app.
          </p>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-line py-2 text-sm text-ink-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded bg-ink py-2 text-sm font-medium text-surface hover:bg-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div className="mt-5 space-y-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => {
              onLeave();
              onClose();
            }}
            className="w-full rounded-full border border-line py-2.5 text-sm text-ink-muted hover:text-ink"
          >
            Leave space
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="w-full rounded-full border border-red-500/30 py-2.5 text-sm text-red-300 hover:border-red-400/50 disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete space & all data"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CoupleSettings } from "@/lib/types";

interface Props {
  open: boolean;
  settings: CoupleSettings;
  onClose: () => void;
  onSave: (next: CoupleSettings) => Promise<void>;
}

export function CoupleSettingsModal({ open, settings, onClose, onSave }: Props) {
  const [partnerAName, setPartnerAName] = useState(settings.partnerAName);
  const [partnerBName, setPartnerBName] = useState(settings.partnerBName);
  const [coupleLabel, setCoupleLabel] = useState(settings.coupleLabel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPartnerAName(settings.partnerAName);
      setPartnerBName(settings.partnerBName);
      setCoupleLabel(settings.coupleLabel);
      setError(null);
    }
  }, [open, settings]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ partnerAName, partnerBName, coupleLabel });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh]">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md border border-line bg-surface-elevated p-5"
      >
        <h2 className="text-base font-semibold mb-1">Workspace</h2>
        <p className="text-xs text-ink-muted mb-4">
          Display names and tracker title. Synced on both devices.
        </p>

        <label className="block mb-3">
          <span className="text-xs text-ink-muted uppercase tracking-wide">
            Tracker title
          </span>
          <input
            value={coupleLabel}
            onChange={(e) => setCoupleLabel(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-critical"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Person A
            </span>
            <input
              required
              value={partnerAName}
              onChange={(e) => setPartnerAName(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-critical"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-muted uppercase tracking-wide">
              Person B
            </span>
            <input
              required
              value={partnerBName}
              onChange={(e) => setPartnerBName(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
          </label>
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
      </form>
    </div>
  );
}

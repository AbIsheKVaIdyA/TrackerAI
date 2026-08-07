"use client";

import type { PersonFilter } from "@/lib/types";

interface Props {
  filter: PersonFilter;
  onChange: (f: PersonFilter) => void;
  /** When false, hide Yours / Together (solo space) */
  hasPartner?: boolean;
}

export function PersonFilterBar({
  filter,
  onChange,
  hasPartner = true,
}: Props) {
  const options: { value: PersonFilter; label: string }[] = hasPartner
    ? [
        { value: "all", label: "All" },
        { value: "mine", label: "Mine" },
        { value: "yours", label: "Yours" },
        { value: "together", label: "Together" },
      ]
    : [
        { value: "all", label: "All" },
        { value: "mine", label: "Mine" },
      ];

  return (
    <div className="mb-5 inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-line/80 bg-surface-elevated/60 p-1">
      {options.map((opt) => {
        const active = filter === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active ? "bg-ink text-surface" : "text-ink-dim hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

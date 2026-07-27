"use client";

import type { CoupleSettings, PartnerId, PersonFilter } from "@/lib/types";
import { partnerName } from "@/lib/types";

interface Props {
  settings: CoupleSettings;
  me: PartnerId;
  filter: PersonFilter;
  onChange: (f: PersonFilter) => void;
}

export function PersonFilterBar({ settings, filter, onChange }: Props) {
  const options: { value: PersonFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "a", label: partnerName("a", settings) },
    { value: "b", label: partnerName("b", settings) },
    { value: "both", label: "Shared" },
  ];

  return (
    <div className="mb-5 flex items-center gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-0.5">
      {options.map((opt) => {
        const active = filter === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-accent text-surface"
                : "border border-line text-ink-muted hover:border-accent/40 hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

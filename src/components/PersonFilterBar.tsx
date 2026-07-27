"use client";

import type { CoupleSettings, PartnerId, PersonFilter } from "@/lib/types";
import { partnerName } from "@/lib/types";

interface Props {
  settings: CoupleSettings;
  me: PartnerId;
  filter: PersonFilter;
  onChange: (f: PersonFilter) => void;
}

export function PersonFilterBar({ settings, me, filter, onChange }: Props) {
  const options: { value: PersonFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "mine", label: "Mine" },
    { value: "a", label: partnerName("a", settings) },
    { value: "b", label: partnerName("b", settings) },
    { value: "both", label: "Shared" },
  ];

  return (
    <div className="flex items-center gap-1 mb-4 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-0.5">
      <span className="mr-1 shrink-0 text-[11px] uppercase tracking-wider text-ink-dim">
        Show
      </span>
      {options.map((opt) => {
        const active = filter === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`shrink-0 rounded px-2.5 py-1.5 text-xs transition-colors ${
              active
                ? opt.value === "b"
                  ? "bg-sky-500/20 text-sky-300"
                  : opt.value === "a" || (opt.value === "mine" && me === "a")
                    ? "bg-critical-dim text-critical"
                    : "bg-surface-hover text-ink"
                : "text-ink-muted hover:bg-surface-hover hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

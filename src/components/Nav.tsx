"use client";

import { useEffect, useRef, useState } from "react";
import type { CoupleSettings, PartnerId } from "@/lib/types";
import { partnerName } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/week", label: "Week view" },
  { href: "/backlog", label: "Backlog" },
  { href: "/summary", label: "End of week" },
];

interface Props {
  onAdd: () => void;
  onSettings: () => void;
  onChoose: (id: PartnerId) => void;
  settings: CoupleSettings;
  me: PartnerId;
  live: boolean;
}

export function Nav({
  onAdd,
  onSettings,
  onChoose,
  settings,
  me,
  live,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="shrink-0 font-semibold tracking-tight text-ink">
          {settings.coupleLabel}
        </Link>

        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto text-sm">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-2.5 py-1.5 whitespace-nowrap transition-colors ${
                  active
                    ? "bg-surface-hover text-ink"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <span
            title={live ? "Realtime sync active" : "Connecting…"}
            className={`hidden sm:inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
              live ? "text-green-400/90" : "text-ink-dim"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live ? "bg-green-400" : "bg-ink-dim"
              }`}
            />
            Live
          </span>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`rounded border px-2 py-1 text-xs ${
                me === "a"
                  ? "border-critical/40 text-critical"
                  : "border-sky-500/40 text-sky-300"
              }`}
              title="Switch profile"
            >
              {partnerName(me, settings)} ▾
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 min-w-[9rem] border border-line bg-surface-elevated py-1 shadow-lg z-50">
                {(["a", "b"] as PartnerId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChoose(id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-surface-hover ${
                      me === id
                        ? id === "a"
                          ? "text-critical"
                          : "text-sky-300"
                        : "text-ink-muted"
                    }`}
                  >
                    <span>{partnerName(id, settings)}</span>
                    {me === id && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onSettings}
            className="rounded px-2 py-1 text-xs text-ink-muted hover:bg-surface-hover hover:text-ink"
            title="Workspace settings"
          >
            Settings
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-surface hover:bg-white transition-colors"
          >
            + Add task
          </button>
        </div>
      </div>
    </header>
  );
}

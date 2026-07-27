"use client";

import { useEffect, useRef, useState } from "react";
import type { CoupleSettings, PartnerId } from "@/lib/types";
import { partnerName } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/week", label: "Week", short: "Week" },
  { href: "/backlog", label: "Backlog", short: "Back" },
  { href: "/summary", label: "Summary", short: "End" },
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

  const brandShort =
    settings.coupleLabel.length > 16
      ? settings.coupleLabel.slice(0, 14) + "…"
      : settings.coupleLabel;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <Link
            href="/"
            className="min-w-0 shrink font-semibold tracking-tight text-ink text-sm sm:text-base truncate"
            title={settings.coupleLabel}
          >
            <span className="sm:hidden">{brandShort}</span>
            <span className="hidden sm:inline">{settings.coupleLabel}</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex flex-1 items-center gap-0.5 overflow-x-auto text-sm">
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
                  {link.label === "Home" ? "Dashboard" : link.label === "Summary" ? "End of week" : link.label === "Week" ? "Week view" : link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span
              title={live ? "Realtime sync active" : "Connecting…"}
              className={`inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] uppercase tracking-wide ${
                live ? "text-green-400/90" : "text-ink-dim"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  live ? "bg-green-400" : "bg-ink-dim"
                }`}
              />
              <span className="hidden sm:inline">Live</span>
            </span>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`rounded border px-2 py-1.5 text-xs min-h-[32px] ${
                  me === "a"
                    ? "border-critical/40 text-critical"
                    : "border-sky-500/40 text-sky-300"
                }`}
                title="Switch profile"
              >
                {partnerName(me, settings)}
                <span className="ml-0.5 opacity-70">▾</span>
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
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs hover:bg-surface-hover ${
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
              className="hidden sm:inline-flex rounded px-2 py-1.5 text-xs text-ink-muted hover:bg-surface-hover hover:text-ink min-h-[32px]"
              title="Workspace settings"
            >
              Settings
            </button>

            <button
              type="button"
              onClick={onAdd}
              className="rounded bg-ink px-2.5 sm:px-3 py-1.5 text-sm font-medium text-surface hover:bg-white transition-colors min-h-[32px]"
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ Add task</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-6xl items-stretch">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 py-2.5 text-center text-[11px] font-medium transition-colors ${
                  active ? "text-ink" : "text-ink-dim"
                }`}
              >
                <span
                  className={`mx-auto mb-0.5 block h-0.5 w-5 rounded-full ${
                    active ? "bg-critical" : "bg-transparent"
                  }`}
                />
                {link.short}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onSettings}
            className="flex-1 py-2.5 text-center text-[11px] font-medium text-ink-dim"
          >
            <span className="mx-auto mb-0.5 block h-0.5 w-5 rounded-full bg-transparent" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}

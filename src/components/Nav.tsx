"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import type { CoupleSettings, PartnerId } from "@/lib/types";
import { partnerName } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

const DESKTOP_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
  { href: "/lists", label: "Lists" },
  { href: "/review", label: "Review" },
  { href: "/backlog", label: "Backlog" },
];

const MOBILE_LINKS = [
  { href: "/capture", label: "Add", short: "Add" },
  { href: "/home", label: "Home", short: "Home" },
  { href: "/tasks", label: "Tasks", short: "Tasks" },
  { href: "/calendar", label: "Calendar", short: "Cal" },
];

const MORE_LINKS = [
  { href: "/lists", label: "Lists" },
  { href: "/review", label: "Weekly review" },
  { href: "/backlog", label: "Backlog" },
];

interface Props {
  onSettings: () => void;
  onSearch?: () => void;
  onLeaveSpace?: () => void;
  settings: CoupleSettings;
  me: PartnerId;
}

export function Nav({
  onSettings,
  onSearch,
  onLeaveSpace,
  settings,
  me,
}: Props) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const onCapture = pathname.startsWith("/capture");
  const myName = partnerName(me, settings);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const brandShort =
    settings.coupleLabel.length > 16
      ? settings.coupleLabel.slice(0, 14) + "…"
      : settings.coupleLabel;

  const moreActive =
    MORE_LINKS.some((l) => pathname.startsWith(l.href)) || moreOpen;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-4">
          <Link
            href="/home"
            className="min-w-0 shrink font-display text-lg sm:text-xl tracking-tight text-ink truncate"
            title={settings.coupleLabel}
          >
            <span className="sm:hidden">{brandShort}</span>
            <span className="hidden sm:inline">{settings.coupleLabel}</span>
          </Link>

          <nav className="hidden md:flex flex-1 items-center gap-0.5 overflow-x-auto text-sm">
            {DESKTOP_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 whitespace-nowrap transition-colors ${
                    active
                      ? "bg-accent-dim text-accent-strong"
                      : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions: search · identity · account · add */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
            {onSearch && (
              <button
                type="button"
                onClick={onSearch}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line/70 bg-surface-elevated/40 px-2.5 text-ink-muted transition-colors hover:border-line hover:text-ink sm:px-3"
                title="Search (⌘K)"
                aria-label="Search"
              >
                <SearchIcon />
                <span className="hidden text-xs sm:inline">Search</span>
                <kbd className="hidden rounded border border-line/60 px-1 py-px text-[10px] text-ink-dim lg:inline">
                  ⌘K
                </kbd>
              </button>
            )}

            <div className="hidden h-5 w-px bg-line/70 sm:block" aria-hidden />

            <div className="flex items-center gap-2 rounded-full border border-line/70 bg-surface-elevated/50 py-1 pl-2.5 pr-1">
              <div className="min-w-0 hidden sm:block">
                <p className="truncate text-[11px] leading-none text-ink-dim">
                  You
                </p>
                <p className="mt-0.5 max-w-[7rem] truncate text-xs font-medium leading-none text-ink">
                  {myName}
                </p>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 ring-1 ring-line",
                    userButtonPopoverCard:
                      "border border-line bg-surface-elevated shadow-xl",
                    userButtonPopoverActionButton: "hover:bg-surface-hover",
                    userButtonPopoverActionButtonText: "text-ink",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Space settings"
                    labelIcon={<GearIcon />}
                    onClick={onSettings}
                  />
                  {onLeaveSpace && (
                    <UserButton.Action
                      label="Leave space"
                      labelIcon={<LeaveIcon />}
                      onClick={onLeaveSpace}
                    />
                  )}
                </UserButton.MenuItems>
              </UserButton>
            </div>

            {!onCapture && (
              <Link
                href="/capture"
                className="inline-flex h-9 items-center rounded-full bg-ink px-3.5 text-sm font-medium text-surface transition-colors hover:bg-white"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ Add</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-6xl items-stretch">
          {MOBILE_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
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
                    active ? "bg-accent" : "bg-transparent"
                  }`}
                />
                {link.short}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex-1 py-2.5 text-center text-[11px] font-medium ${
              moreActive ? "text-ink" : "text-ink-dim"
            }`}
          >
            <span
              className={`mx-auto mb-0.5 block h-0.5 w-5 rounded-full ${
                moreActive ? "bg-accent" : "bg-transparent"
              }`}
            />
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMoreOpen(false)}
          />
          <div className="relative z-10 w-full rounded-t-2xl border border-line bg-surface-elevated px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="mb-3 flex items-center justify-between rounded-xl border border-line/70 bg-surface px-3 py-2.5">
              <div>
                <p className="text-[11px] text-ink-dim">Signed in as</p>
                <p className="text-sm text-ink">{myName}</p>
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
            <p className="mb-2 text-xs uppercase tracking-wide text-ink-dim">
              More
            </p>
            <ul className="space-y-0.5">
              {MORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block rounded-xl px-3 py-3 text-sm ${
                      pathname.startsWith(link.href)
                        ? "bg-accent-dim text-accent-strong"
                        : "text-ink hover:bg-surface-hover"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {onSearch && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onSearch();
                    }}
                    className="block w-full rounded-xl px-3 py-3 text-left text-sm text-ink hover:bg-surface-hover"
                  >
                    Search
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    onSettings();
                  }}
                  className="block w-full rounded-xl px-3 py-3 text-left text-sm text-ink hover:bg-surface-hover"
                >
                  Space settings
                </button>
              </li>
              {onLeaveSpace && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onLeaveSpace();
                    }}
                    className="block w-full rounded-xl px-3 py-3 text-left text-sm text-ink-muted hover:bg-surface-hover"
                  >
                    Leave space
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

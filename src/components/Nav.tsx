"use client";

import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
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
  const { user } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);
  const onCapture = pathname.startsWith("/capture");
  const seatName = partnerName(me, settings);
  const displayName =
    user?.firstName ||
    user?.username ||
    (seatName !== "Partner A" && seatName !== "Partner B" ? seatName : null) ||
    "Account";

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreActive =
    MORE_LINKS.some((l) => pathname.startsWith(l.href)) || moreOpen;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-4">
          <Link
            href="/home"
            className="shrink-0 font-display text-lg sm:text-xl tracking-tight text-ink"
          >
            Tandem
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

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {onSearch && (
              <button
                type="button"
                onClick={onSearch}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
                title="Search (⌘K)"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            )}

            <button
              type="button"
              onClick={onSettings}
              className="hidden h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink sm:inline-flex"
              title="Space settings"
              aria-label="Space settings"
            >
              <GearIcon />
            </button>

            {!onCapture && (
              <Link
                href="/capture"
                className="inline-flex h-9 items-center rounded-full bg-ink px-3.5 text-sm font-medium text-surface transition-colors hover:bg-white"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ Add</span>
              </Link>
            )}

            <div className="ml-0.5 flex items-center gap-2 pl-1">
              <span className="hidden max-w-[6.5rem] truncate text-sm text-ink-muted sm:inline">
                {displayName}
              </span>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  variables: {
                    colorPrimary: "#8fa8b8",
                    colorText: "#f5f5f5",
                    colorBackground: "#111111",
                    colorInputBackground: "#050505",
                    colorInputText: "#f5f5f5",
                    borderRadius: "0.75rem",
                  },
                  elements: {
                    avatarBox:
                      "h-8 w-8 rounded-full ring-1 ring-accent/40 shadow-[0_0_0_3px_rgba(143,168,184,0.08)]",
                    userButtonTrigger:
                      "rounded-full focus:shadow-none focus:ring-2 focus:ring-accent/40",
                    userButtonPopoverCard:
                      "border border-line bg-surface-elevated shadow-xl",
                    userButtonPopoverMain: "bg-surface-elevated",
                    userButtonPopoverActionButton: "hover:bg-surface-hover",
                    userButtonPopoverActionButtonText: "text-ink",
                    userButtonPopoverActionButtonIcon: "text-ink-muted",
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
            <div className="mb-3 flex items-center justify-between rounded-xl border border-line/60 bg-surface/80 px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink-dim">
                  {settings.coupleLabel}
                </p>
                <p className="mt-1 truncate text-sm text-ink">{displayName}</p>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  variables: { colorPrimary: "#8fa8b8" },
                  elements: {
                    avatarBox: "h-9 w-9 ring-1 ring-accent/40",
                    userButtonPopoverFooter: "hidden",
                  },
                }}
              />
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

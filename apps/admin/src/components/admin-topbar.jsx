"use client";

import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { NotificationsButton } from "@/components/notifications/notifications-button";
import { ThemeToggle } from "@/components/theme-toggle";

/** The bar's icons: just the grey icon, a soft square only under the pointer. */
export const BAR_ICON =
  "size-8 rounded-md bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-[1.125rem]";

/**
 * Computers: the strip across the top of the screen. No fill, outline or rounding:
 * it sits straight on the page. The logo; search in the middle; light/dark and
 * the bell at the other end. Phones get their own header (admin-shell).
 */
export function AdminTopBar({ onSearch }) {
  return (
    <div className="relative hidden h-12 shrink-0 items-center gap-2 px-4 md:flex">
      <Link href="/dashboard" aria-label="Vela Noire dashboard" className="flex shrink-0 items-center gap-2.5">
        <Image src="/logo.png" width={100} height={38} alt="Vela Noire" priority className="dark:invert" />
      </Link>

      {/* Search, in the middle of the bar, and Ctrl K anywhere. Wide screens only. */}
      <div className="pointer-events-none absolute inset-x-0 hidden justify-center lg:flex">
        <button
          type="button"
          onClick={onSearch}
          aria-keyshortcuts="Control+K"
          className="pointer-events-auto flex h-9 w-88 items-center gap-2.5 rounded-lg bg-black/5 px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-black/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 xl:w-96 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <SearchIcon className="size-4 shrink-0" />
          <span className="flex-1 text-start">Search</span>
          <span className="text-xs font-medium text-muted-foreground/80">Ctrl K</span>
        </button>
      </div>

      <div className="ms-auto flex items-center gap-1">
        {/* Narrow screens: search as an icon */}
        <button type="button" onClick={onSearch} aria-label="Search" className={`flex items-center justify-center lg:hidden ${BAR_ICON}`}>
          <SearchIcon />
        </button>
        <ThemeToggle shortcut className={BAR_ICON} />
        <NotificationsButton shortcut className={BAR_ICON} />
      </div>
    </div>
  );
}

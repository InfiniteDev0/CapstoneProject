"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NotificationsButton } from "@/components/notifications/notifications-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { breadcrumbs } from "@/lib/admin-nav";

/** The bar's icons: just the grey icon, a soft square only under the pointer. */
export const BAR_ICON =
  "size-8 rounded-md bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-[1.125rem]";

/** Where you are: Vela Noire › Products › Inventory. Every step but the last is a link. */
function TopBarBreadcrumb() {
  const trail = breadcrumbs(usePathname());
  return (
    <Breadcrumb className="ms-4 min-w-0">
      <BreadcrumbList className="flex-nowrap text-[0.9375rem]">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Vela Noire</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {trail.map((step, i) => (
          <Fragment key={step.url}>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              {i === trail.length - 1 ? (
                <BreadcrumbPage className="truncate font-semibold">{step.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={step.url}>{step.title}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Computers: the strip across the top of the screen. No fill, outline or rounding:
 * it sits straight on the page. The logo and the breadcrumb; search in the middle;
 * light/dark and the bell at the other end.
 * Phones get their own header inside the main panel (admin-shell).
 */
export function AdminTopBar({ onSearch }) {
  return (
    <div className="relative hidden h-12 shrink-0 items-center gap-2 px-4 md:flex">
      <Link href="/dashboard" aria-label="Vela Noire dashboard" className="flex shrink-0 items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-black text-xs tracking-tight text-white dark:bg-white dark:text-black">
          VN
        </span>
        <Image src="/logo.png" width={100} height={38} alt="Vela Noire" priority className="dark:invert" />
      </Link>

      <TopBarBreadcrumb />

      {/* Search, in the middle of the bar, and Ctrl K anywhere. Wide screens only. */}
      <div className="pointer-events-none absolute inset-x-0 hidden justify-center xl:flex">
        <button
          type="button"
          onClick={onSearch}
          aria-keyshortcuts="Control+K"
          className="pointer-events-auto flex h-9 w-88 items-center gap-2.5 rounded-lg bg-black/5 px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-black/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 2xl:w-96 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <SearchIcon className="size-4 shrink-0" />
          <span className="flex-1 text-start">Search</span>
          <span className="text-xs font-medium text-muted-foreground/80">Ctrl K</span>
        </button>
      </div>

      <div className="ms-auto flex items-center gap-1">
        {/* Narrower screens: search as an icon, so it never covers the breadcrumb */}
        <button type="button" onClick={onSearch} aria-label="Search" className={`flex items-center justify-center xl:hidden ${BAR_ICON}`}>
          <SearchIcon />
        </button>
        <ThemeToggle shortcut className={BAR_ICON} />
        <NotificationsButton shortcut className={BAR_ICON} />
      </div>
    </div>
  );
}

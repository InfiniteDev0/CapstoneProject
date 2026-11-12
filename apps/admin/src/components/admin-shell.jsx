"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { AdminTopBar, BAR_ICON } from "@/components/admin-topbar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { NotificationsButton } from "@/components/notifications/notifications-button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useKeyShortcut } from "@/hooks/use-key-shortcut";
import { pageTitle } from "@/lib/admin-nav";

/**
 * The admin frame (Barista's layout).
 * Computers: the screen in three: the top bar across the whole width, the
 * sidebar card under it, the main panel beside it. Only the panel's contents scroll.
 * Phones: the panel fills the screen with a small header (menu, page, search, bell);
 * the sidebar opens as a sheet.
 */
export function AdminShell({ children }) {
  const pathname = usePathname();
  const scrollRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const title = pageTitle(pathname);

  useKeyShortcut("k", () => setSearchOpen((o) => !o), { ctrl: true });

  // The panel scrolls, not the window, so start each new page at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    document.title = `${title} | Vela Noire Admin`;
  }, [title]);

  return (
    <TooltipProvider>
      <div className="bg-background text-foreground md:flex md:h-svh md:flex-col md:overflow-hidden">
        <AdminTopBar onSearch={() => setSearchOpen(true)} />
        <SidebarProvider className="md:min-h-0 md:flex-1">
          {/* Below the top bar (h-12), not over it; the card's own padding is the gap to the edges */}
          <AppSidebar className="md:top-12 md:bottom-0 md:h-auto md:pt-0" />
          <SidebarInset className="bg-canvas max-md:min-h-svh md:mr-2 md:mb-2 md:min-h-0 md:overflow-hidden md:rounded-lg border-0 shadow-none ring-0">
            {/* Phones: menu, page name, search and bell instead of the top bar */}
            <header className="flex h-14 shrink-0 items-center gap-2 bg-canvas px-3 md:hidden">
              <SidebarTrigger className="size-9" />
              <span className="min-w-0 flex-1 truncate text-[1.0625rem] font-medium">{title}</span>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="grid size-9 place-items-center rounded-md text-neutral-600 transition-colors hover:bg-black/5"
              >
                <SearchIcon className="size-5" />
              </button>
              <NotificationsButton className={BAR_ICON} />
            </header>

            {/* What scrolls (the frame never does) */}
            <div ref={scrollRef} className="scrollbar-pill flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
              <div key={pathname} className="mx-auto w-full max-w-[96rem] animate-in px-4 py-6 duration-300 fade-in-0 slide-in-from-bottom-2 lg:px-6">
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
        <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TooltipProvider>
  );
}

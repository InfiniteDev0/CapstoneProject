"use client";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { adminUser, navMain } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * The admin sidebar: a standalone rounded card under the top bar (Barista's layout),
 * with Vela Noire's own items inside. Collapse at the top folds it to an icon rail;
 * the "Platform" menu in the middle; the account card at the bottom.
 * (The logo lives in the top bar.)
 */
export function AppSidebar({ className, ...props }) {
  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className={cn(
        // The card itself: gently rounded, no outline or shadow; its grey sets it off the white page
        "*:data-[slot=sidebar-inner]:rounded-lg *:data-[slot=sidebar-inner]:shadow-none! *:data-[slot=sidebar-inner]:ring-0! *:data-[slot=sidebar-inner]:border-0!",
        className,
      )}
      {...props}
    >
      <SidebarHeader>
        <SidebarToggle />
      </SidebarHeader>
      <SidebarContent className="scrollbar-pill">
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={adminUser} />
      </SidebarFooter>
    </Sidebar>
  );
}

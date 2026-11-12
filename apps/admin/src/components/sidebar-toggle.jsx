"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Top of the sidebar (from Barista): the button that folds it to an icon rail («)
 * and opens it again (»), with a short line under it.
 * Open: a full-width row that says Collapse. Folded: just the icon, centred.
 */
export function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const open = state === "expanded";
  const Icon = open ? ChevronsLeft : ChevronsRight;

  return (
    <div className="flex flex-col gap-3 pt-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={open ? "Collapse the sidebar" : "Open the sidebar"}
        aria-expanded={open}
        className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-start text-sidebar-foreground transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
      >
        <Icon className="size-5 shrink-0" strokeWidth={2.5} />
        <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">Collapse</span>
      </button>
      <span aria-hidden className="h-0.5 w-full rounded-full bg-sidebar-foreground/10 group-data-[collapsible=icon]:w-6" />
    </div>
  );
}

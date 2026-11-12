"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, SearchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { allPages } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * Search (Ctrl K): type to find any admin page, arrow keys to pick, Enter to go.
 * Later phases can add products and customers to the results.
 */
export function CommandPalette({ open, onOpenChange }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const q = query.trim().toLowerCase();
  const results = allPages.filter(
    (page) => !q || page.title.toLowerCase().includes(q) || page.parent?.toLowerCase().includes(q),
  );
  const active = Math.min(index, Math.max(results.length - 1, 0));

  const close = (next) => {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setIndex(0);
    }
  };

  const go = (page) => {
    close(false);
    router.push(page.url);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((active + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((active - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent showCloseButton={false} className="top-[20%] translate-y-0 gap-0 overflow-hidden rounded-lg border-0 p-0 shadow-2xl ring-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Find a page in the admin</DialogDescription>
        <div className="flex items-center gap-2.5 bg-muted/50 px-4">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search pages…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded-md bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">Esc</kbd>
        </div>
        <ul className="scrollbar-pill max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">No page called “{query}”</li>
          ) : (
            results.map((page, i) => {
              const Icon = page.icon;
              return (
                <li key={page.url}>
                  <button
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => go(page)}
                    className={cn(
                      "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm",
                      i === active ? "bg-muted text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">
                      {page.parent ? <span className="text-muted-foreground">{page.parent} / </span> : null}
                      <span className="font-medium text-foreground">{page.title}</span>
                    </span>
                    {i === active ? <CornerDownLeft className="size-3.5 text-muted-foreground" /> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

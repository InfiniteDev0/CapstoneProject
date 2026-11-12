"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useKeyShortcut } from "@/hooks/use-key-shortcut";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatedList } from "@/components/motion/animated-list";
import { SwipeNotification, SwipeReveal } from "./swipe";
import { adminUser } from "@/lib/admin-nav";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { NotificationCard } from "./notification-card";
import {
  buildNotifications,
  notificationStore,
  todayIso,
  useNotificationState,
} from "./notifications-data";

const HEADER_BUTTON =
  "flex size-9 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-black/5 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-5";

/** How long the sheet takes to slide away; the page changes after it has. */
const SHEET_CLOSE_MS = 250;

/** The bell's shape: a ringing bell (from Barista). */
function BellRingGlyph({ className }) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.52302 1.30256c0.93749 -0.81564 2.35868 -0.716867 3.17428 0.22062 0.8157 0.93749 0.7169 2.35868 -0.2206 3.17432 -3.46434 3.01412 -5.81837 7.4263 -6.23439 12.4869 -0.10181 1.2384 -1.18831 2.1599 -2.42678 2.0581 -1.23846 -0.1018 -2.159898 -1.1883 -2.058087 -2.4268C1.27059 10.5736 4.18198 5.07942 8.52302 1.30256Zm27.77948 0.22062c0.8156 -0.937487 2.2368 -1.03626 3.1743 -0.22062 4.341 3.77686 7.2524 9.27104 7.7656 15.51314 0.1018 1.2385 -0.8196 2.325 -2.0581 2.4268 -1.2385 0.1018 -2.325 -0.8197 -2.4268 -2.0581 -0.416 -5.0606 -2.77 -9.47278 -6.2344 -12.4869 -0.9375 -0.81564 -1.0363 -2.23683 -0.2206 -3.17432ZM23.9999 3.5c7.9182 0 14.5194 6.05958 15.1956 13.9489l0.4791 5.5894c0.2139 2.4951 1.0105 4.9053 2.3257 7.0365l1.4711 2.3837c1.4773 2.3937 0.6715 4.8664 -2.1168 5.2373 -3.1881 0.4241 -8.5121 0.8042 -17.3547 0.8042 -8.8426 0 -14.16656 -0.3801 -17.35475 -0.8042 -2.78827 -0.3709 -3.59405 -2.8436 -2.1168 -5.2373l1.47113 -2.3837c1.31523 -2.1312 2.11184 -4.5414 2.32571 -7.0365l0.47909 -5.5894C9.48051 9.55958 16.0817 3.5 23.9999 3.5Zm0 38c-3.2509 0 -6.0435 -0.0509 -8.4431 -0.1372C17.1373 44.4145 20.3241 46.5 23.998 46.5c3.6738 0 6.8606 -2.0854 8.4411 -5.1371 -2.3988 0.0863 -5.1901 0.1371 -8.4392 0.1371Z"
      />
    </svg>
  );
}

/**
 * The bell, with the unread count, and the notifications sheet it opens: a
 * floating panel of toast-like cards, today's first and unread on top.
 * "Clear all" and "Mark all as read" in the header; N opens it from anywhere
 * (only the copy with `shortcut` listens, so the phone header's copy doesn't double up).
 */
export function NotificationsButton({ className, shortcut = false }) {
  const router = useRouter();
  const { read, cleared } = useNotificationState();
  const [open, setOpen] = useState(false);
  // Computers: the one card slid open to show its Clear or Open button
  const [revealed, setRevealed] = useState(null);
  const isMobile = useIsMobile();
  useKeyShortcut("n", () => setOpen((o) => !o), { enabled: shortcut });

  const today = todayIso();
  const all = buildNotifications(today, adminUser.name.split(" ")[0]);
  const visible = all.filter(({ id }) => !cleared.has(id));
  const unread = visible.filter(({ id }) => !read.has(id));

  // Today's first, then earlier ones; in each, unread on top.
  const isToday = (n) => n.date === today;
  const readOnes = visible.filter(({ id }) => read.has(id));
  const shown = [
    ...unread.filter(isToday),
    ...readOnes.filter(isToday),
    ...unread.filter((n) => !isToday(n)),
    ...readOnes.filter((n) => !isToday(n)),
  ];
  const headings = new Map();
  const firstToday = shown.find(isToday);
  const firstEarlier = shown.find((n) => !isToday(n));
  if (firstToday) headings.set(firstToday.id, "Today");
  if (firstEarlier) headings.set(firstEarlier.id, "Earlier");

  /** Cleared, with a way back. */
  const clear = (list) => {
    const ids = list.map(({ id }) => id);
    notificationStore.clear(ids);
    setRevealed(null);
    notify.success(list.length === 1 ? `"${list[0].title}" cleared` : `${list.length} notifications cleared`, {
      action: { label: "Undo", onClick: () => notificationStore.restore(ids) },
    });
  };

  /** It counts as read, the sheet gets out of the way, then its page opens. */
  const openNotification = (n) => {
    notificationStore.markRead([n.id]);
    setRevealed(null);
    setOpen(false);
    window.setTimeout(() => router.push(n.href), SHEET_CLOSE_MS);
  };

  const card = (n) => (
    <NotificationCard
      notification={n}
      read={read.has(n.id)}
      today={today}
      onOpen={() => openNotification(n)}
    />
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setRevealed(null);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-keyshortcuts={shortcut ? "N" : undefined}
              aria-label={unread.length > 0 ? `Notifications, ${unread.length} unread` : "Notifications"}
              className={cn(
                "relative flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-700 transition-colors outline-none hover:text-neutral-950 focus-visible:ring-3 focus-visible:ring-ring/30 dark:text-neutral-300 dark:hover:text-neutral-50",
                className,
              )}
            >
              <BellRingGlyph className="size-4 shrink-0" />
              {unread.length > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.625rem] font-semibold text-white tabular-nums ring-2 ring-background">
                  {unread.length > 99 ? "99+" : unread.length}
                </span>
              ) : null}
            </button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications{shortcut ? " · N" : ""}</TooltipContent>
      </Tooltip>

      <SheetContent
        showCloseButton={false}
        className={cn(
          // A pale sage panel that floats off the screen's edge, a little wider than a standard sheet
          "gap-0 border-0 bg-[#e8ede8] p-0 dark:bg-neutral-950",
          "data-[side=right]:border-0 data-[side=right]:sm:max-w-104 md:data-[side=right]:inset-y-2 md:data-[side=right]:right-2 md:data-[side=right]:h-auto md:data-[side=right]:rounded-lg",
          "max-md:data-[side=right]:w-full",
        )}
      >
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <SheetTitle className="text-lg font-medium tracking-tight">Notifications</SheetTitle>
            <SheetDescription className="sr-only">
              {unread.length > 0 ? `${unread.length} unread` : "You're all caught up"}
            </SheetDescription>
          </div>
          <div className="-mr-2 flex items-center gap-1">
            <button
              type="button"
              disabled={visible.length === 0}
              onClick={() => clear(visible)}
              className="me-1 h-8 rounded-full bg-black/5 px-3 text-[0.8125rem] font-semibold text-foreground transition-colors outline-none hover:bg-black/10 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-40"
            >
              Clear all
            </button>
            <button
              type="button"
              aria-label="Mark all as read"
              title="Mark all as read"
              disabled={unread.length === 0}
              onClick={() => notificationStore.markRead(unread.map(({ id }) => id))}
              className={HEADER_BUTTON}
            >
              <CheckCheck />
            </button>
            <SheetClose asChild>
              <button type="button" aria-label="Close" title="Close" className={HEADER_BUTTON}>
                <X />
              </button>
            </SheetClose>
          </div>
        </div>

        {shown.length > 0 ? (
          <AnimatedList
            aria-label="Notifications"
            items={shown}
            getKey={(n) => n.id}
            onItemSelect={openNotification}
            onItemRemove={(n) => clear([n])}
            gradientClassName="from-[#e8ede8] dark:from-neutral-950"
            className="min-h-0 flex-1"
            listClassName="px-4 pt-2 pb-8"
            itemClassName="mb-5 last:mb-0"
            renderItem={(n) => (
              <>
                {headings.has(n.id) ? (
                  <h3 className="mb-2 px-1 text-sm font-semibold text-muted-foreground">{headings.get(n.id)}</h3>
                ) : null}
                {/* Phones: swipe right to clear, left to open. Computers: drag to show Clear or Open. */}
                {isMobile ? (
                  <SwipeNotification onClear={() => clear([n])} onOpen={() => openNotification(n)}>
                    {card(n)}
                  </SwipeNotification>
                ) : (
                  <SwipeReveal
                    revealed={revealed?.id === n.id ? revealed.side : null}
                    onRevealChange={(side) => setRevealed(side ? { id: n.id, side } : null)}
                    onClear={() => clear([n])}
                    onOpen={() => openNotification(n)}
                  >
                    {card(n)}
                  </SwipeReveal>
                )}
              </>
            )}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-card">
              <BellOff className="size-5 text-muted-foreground" />
            </span>
            <p className="font-medium text-foreground">You&apos;re all caught up</p>
            <p className="max-w-64 text-sm text-muted-foreground">
              New orders, low stock, customers at risk and new reviews show up here.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

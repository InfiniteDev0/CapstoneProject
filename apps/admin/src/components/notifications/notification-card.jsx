"use client";

import { Fragment } from "react";
import Link from "next/link";
import { HandCoins, PackageX, PartyPopper, ShieldAlert, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { whenLabel } from "./notifications-data";

/** Each kind in its own colour, so the pill says what it's about at a glance. */
export const KINDS = {
  welcome: {
    icon: PartyPopper,
    tone: "text-cyan-600 dark:text-cyan-400",
    cta: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:hover:bg-cyan-500/25",
  },
  order: {
    icon: HandCoins,
    tone: "text-green-600 dark:text-green-400",
    cta: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/15 dark:text-green-300 dark:hover:bg-green-500/25",
  },
  stock: {
    icon: PackageX,
    tone: "text-orange-600 dark:text-orange-400",
    cta: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/25",
  },
  churn: {
    icon: ShieldAlert,
    tone: "text-red-600 dark:text-red-400",
    cta: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25",
  },
  review: {
    icon: Star,
    tone: "text-violet-600 dark:text-violet-400",
    cta: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25",
  },
};

/**
 * One notification, drawn like a toast: the icon and title in a pill that flows
 * into the body with a soft curve, the details as label–value rows with the
 * time beside them, then a rounded action button. Unread ones carry a dot;
 * read ones fade back but keep their colour.
 */
export function NotificationCard({ notification, read, today, onOpen, onClear }) {
  const { icon: Icon, tone, cta } = KINDS[notification.kind];

  return (
    <div
      className={cn(
        "group/card drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-[opacity,filter] hover:drop-shadow-[0_6px_16px_rgba(0,0,0,0.12)]",
        read && "opacity-60",
      )}
    >
      <div
        className={cn(
          "relative flex h-[2.125rem] w-fit max-w-[calc(100%-1rem)] items-center gap-2 rounded-t-[1.0625rem] bg-card pr-3 pl-2.5",
          tone,
        )}
      >
        <Icon className="size-[1.125rem] shrink-0" />
        <span className="truncate text-[0.8125rem] leading-none font-bold">{notification.title}</span>
        {read ? null : <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-current" />}
        {/* The curve from the pill's side down into the body's top edge */}
        <span
          aria-hidden
          className="absolute bottom-0 left-full size-3.5 bg-[radial-gradient(circle_at_100%_0,transparent_14px,var(--card)_14.5px)]"
        />
      </div>

      <div className="rounded-2xl rounded-tl-none bg-card p-3">
        <div className="flex items-start gap-3">
          <dl className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[0.8125rem] leading-tight">
            {notification.details.map(({ label, value }) => (
              <Fragment key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="truncate text-right font-medium text-foreground">{value}</dd>
              </Fragment>
            ))}
          </dl>
          <span className="shrink-0 text-[0.6875rem] leading-tight whitespace-nowrap text-muted-foreground">
            {whenLabel(notification.date, today)}
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <Link
            href={notification.href}
            onClick={(event) => {
              event.preventDefault();
              onOpen();
            }}
            className={cn(
              "block flex-1 rounded-full px-5 py-2.5 text-center text-[0.8125rem] font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-current/30",
              cta,
            )}
          >
            {notification.action}
          </Link>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full bg-black/5 px-4 text-[0.8125rem] font-semibold text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground dark:bg-white/5 dark:hover:bg-white/10"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/motion/alert";
import { cn } from "@/lib/utils";
import { whenLabel } from "./notifications-data";

/**
 * Each kind as a beui alert variant (its colour + icon), plus the colour of its
 * action button. Review keeps a star icon of its own.
 */
const KINDS = {
  welcome: {
    variant: "info",
    cta: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:hover:bg-cyan-500/25",
  },
  order: {
    variant: "success",
    cta: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/15 dark:text-green-300 dark:hover:bg-green-500/25",
  },
  stock: {
    variant: "warning",
    cta: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:hover:bg-orange-500/25",
  },
  churn: {
    variant: "destructive",
    cta: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25",
  },
  review: {
    variant: "default",
    icon: <Star />,
    cta: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25",
  },
};

/**
 * One notification as a beui Alert: icon, title with the unread dot and the time,
 * the details as label–value rows, then its coloured action button.
 * Read ones fade back but keep their colour. Clearing is by swipe (swipe.jsx) or "Clear all".
 */
export function NotificationCard({ notification, read, today, onOpen }) {
  const { variant, icon, cta } = KINDS[notification.kind];

  return (
    <Alert
      variant={variant}
      className={cn("rounded-lg bg-card shadow-[0_4px_12px_rgba(0,0,0,0.06)]", read && "opacity-60")}
    >
      <AlertIcon>{icon}</AlertIcon>
      <AlertContent>
        <AlertTitle className="flex items-center gap-2">
          <span className="truncate font-semibold">{notification.title}</span>
          {read ? null : <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-current" />}
          <span className="ms-auto shrink-0 text-[0.6875rem] font-normal text-muted-foreground">
            {whenLabel(notification.date, today)}
          </span>
        </AlertTitle>
        <AlertDescription>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-[0.8125rem]">
            {notification.details.map(({ label, value }) => (
              <Fragment key={label}>
                <dt>{label}</dt>
                <dd className="truncate text-right font-medium text-foreground">{value}</dd>
              </Fragment>
            ))}
          </dl>
        </AlertDescription>
        <AlertAction className="flex-nowrap pt-3">
          <Link
            href={notification.href}
            onClick={(event) => {
              event.preventDefault();
              onOpen();
            }}
            draggable={false}
            className={cn(
              "block flex-1 rounded-full px-5 py-2.5 text-center text-[0.8125rem] font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-current/30",
              cta,
            )}
          >
            {notification.action}
          </Link>
        </AlertAction>
      </AlertContent>
    </Alert>
  );
}

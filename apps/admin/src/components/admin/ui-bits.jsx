"use client";

import Link from "next/link";
import { AlertCircle, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUS, PRODUCT_STATUS } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Page title row: title, a short line under it, and actions on the right. */
export function PageHeader({ title, description, back, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-3.5" /> {back.label}
          </Link>
        ) : null}
        <h1 className="truncate text-lg font-medium">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** A white rounded surface on the grey panel (no borders). */
export function Panel({ className, children, title, action }) {
  return (
    <section className={cn("rounded-lg bg-card p-4", className)}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, children, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg bg-card px-6 py-14 text-center", className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <p className="font-medium">{title}</p>
      {message ? <p className="max-w-sm text-sm text-muted-foreground">{message}</p> : null}
      {children}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg bg-card px-6 py-14 text-center", className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
        <AlertCircle className="size-5 text-red-600" />
      </span>
      <p className="font-medium">Couldn&apos;t load this</p>
      <p className="max-w-sm text-sm text-muted-foreground">{error?.message ?? "The API didn't answer. Is it running?"}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-1 rounded-md bg-muted px-3 py-1.5 text-sm hover:bg-accent">
          Try again
        </button>
      ) : null}
    </div>
  );
}

/** Table rows while loading. */
export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-2 rounded-lg bg-card p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function StatusBadge({ status, kind = "order" }) {
  const map = kind === "product" ? PRODUCT_STATUS : ORDER_STATUS;
  const s = map[status] ?? { label: status, tone: "bg-muted" };
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", s.tone)}>{s.label}</span>;
}

/** Previous / page x of y / next. */
export function Pager({ page, totalPages, totalItems, onPage }) {
  if (!totalPages || totalPages <= 1) {
    return totalItems != null ? <p className="mt-3 text-xs text-muted-foreground">{totalItems} total</p> : null;
  }
  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <p className="text-xs text-muted-foreground">{totalItems} total</p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} className="flex size-8 items-center justify-center rounded-md bg-card disabled:opacity-40" aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          Page {page + 1} of {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} className="flex size-8 items-center justify-center rounded-md bg-card disabled:opacity-40" aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Small borderless inputs that match the admin look. */
export const fieldClass =
  "h-9 w-full rounded-md bg-muted px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30";

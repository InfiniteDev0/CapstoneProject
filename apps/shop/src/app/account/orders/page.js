"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusPill } from "@/components/account/OrderParts";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { formatDate, formatPrice } from "@/lib/format";

/** Order history, newest first. */
export default function OrdersPage() {
  const [page, setPage] = useState(0);
  const { data, loading, error, reload } = useApi(`/api/orders?page=${page}&size=10`);

  if (error) return <ErrorState onRetry={reload} />;
  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (data.items.length === 0) {
    return <EmptyState title="No orders yet" message="When you place an order, it will appear here." action={{ label: "Browse the collections", href: "/shop" }} />;
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-zinc-100">
        {data.items.map((o) => (
          <li key={o.id}>
            <Link href={`/account/orders/${o.id}`} className="flex items-center gap-4 py-5 transition-colors hover:bg-zinc-50">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">{o.orderNumber}</span>
                  <StatusPill status={o.status} />
                </div>
                <p className="truncate text-xs text-zinc-500">
                  {formatDate(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                  {o.firstItemName ? ` · ${o.firstItemName}${o.itemCount > 1 ? " and more" : ""}` : ""}
                </p>
              </div>
              <span className="text-sm">{formatPrice(o.total)}</span>
              <ChevronRight className="size-4 text-zinc-400" />
            </Link>
          </li>
        ))}
      </ul>
      {data.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="underline disabled:opacity-30">Newer</button>
          <span className="text-zinc-500">Page {page + 1} of {data.totalPages}</span>
          <button type="button" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)} className="underline disabled:opacity-30">Older</button>
        </div>
      ) : null}
    </div>
  );
}

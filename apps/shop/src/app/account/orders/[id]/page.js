"use client";

import { use } from "react";
import { BackLink, OrderLines, OrderTotals, StatusPill } from "@/components/account/OrderParts";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { formatDate } from "@/lib/format";
import { PAYMENT_LABELS } from "@/lib/labels";

/** One receipt: lines (price snapshot), totals, delivery and the simulated payment. */
export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const { data: order, loading, error, reload } = useApi(`/api/orders/${id}`);

  if (loading) return <Skeleton className="h-80 w-full" />;
  if (error?.status === 404) return <EmptyState title="We couldn't find that order" action={{ label: "Back to your orders", href: "/account/orders" }} />;
  if (error) return <ErrorState onRetry={reload} />;

  return (
    <div className="space-y-8">
      <BackLink href="/account/orders">All orders</BackLink>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">{order.orderNumber}</h2>
          <p className="text-sm text-zinc-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="rounded-md bg-zinc-50 p-6">
        <OrderLines items={order.items} />
        <OrderTotals order={order} />
      </div>

      <div className="grid gap-6 text-sm sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500">Delivering to</p>
          <p>{order.shippingName}</p>
          <p className="text-zinc-600">{order.shippingAddress}</p>
          <p className="text-zinc-600">{[order.shippingCity, order.shippingCountry].filter(Boolean).join(", ")}</p>
        </div>
        {order.payment ? (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500">Payment (demo)</p>
            <p>
              {PAYMENT_LABELS[order.payment.method]}
              {order.payment.cardLast4 ? ` ending ${order.payment.cardLast4}` : ""} · {order.payment.status.toLowerCase()}
            </p>
            <p className="text-zinc-600">Reference {order.payment.reference}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

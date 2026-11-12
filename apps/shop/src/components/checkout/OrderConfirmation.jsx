"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { OrderLines, OrderTotals } from "@/components/account/OrderParts";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { formatDate } from "@/lib/format";
import { PAYMENT_LABELS } from "@/lib/labels";

/** "Thank you": the receipt Java just wrote. */
export default function OrderConfirmation({ id }) {
  const { data: order, loading, error, reload } = useApi(`/api/orders/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error?.status === 404 ? (
        <EmptyState title="We couldn't find that order" action={{ label: "See your orders", href: "/account/orders" }} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="space-y-10">
          <div className="space-y-3 text-center">
            <CheckCircle2 className="mx-auto size-10" strokeWidth={1.2} />
            <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Thank you</p>
            <h1 className="text-3xl">Your order is confirmed</h1>
            <p className="text-sm text-zinc-600">
              Order <span className="font-medium text-black">{order.orderNumber}</span> · {formatDate(order.createdAt)}
            </p>
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
              <p className="text-zinc-600">{order.shippingCity}, {order.shippingCountry}</p>
            </div>
            {order.payment ? (
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500">Payment (demo)</p>
                <p>
                  {PAYMENT_LABELS[order.payment.method]}
                  {order.payment.cardLast4 ? ` ending ${order.payment.cardLast4}` : ""}
                </p>
                <p className="text-zinc-600">Reference {order.payment.reference}</p>
                <p className="text-xs text-zinc-500">Simulated transaction: no money was charged.</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href={`/account/orders/${order.id}`} className="underline underline-offset-4">View order</Link>
            <Link href="/shop" className="underline underline-offset-4">Continue shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}

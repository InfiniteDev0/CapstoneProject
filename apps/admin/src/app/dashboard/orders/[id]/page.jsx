"use client";

import { use, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState, ErrorState, PageHeader, Panel, StatusBadge, TableSkeleton } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { NEXT_STATUS, ORDER_STATUS, PAYMENT_LABELS, SHAYLA_LABELS, STYLE_LABELS, formatDateTime, formatPrice } from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** One order: its lines (price snapshot), payment, delivery, and the next steps it may take. */
export default function AdminOrderPage({ params }) {
  const { id } = use(params);
  const { data: order, loading, error, reload, setData } = useApi(`/api/admin/orders/${id}`);
  const customer = useApi(order ? `/api/admin/customers/${order.userId}` : null);
  const [confirm, setConfirm] = useState(null); // status waiting for "are you sure?"
  const [busy, setBusy] = useState(false);

  if (loading) return <TableSkeleton rows={8} />;
  if (error?.status === 404) {
    return (
      <>
        <PageHeader title="Order not found" back={{ href: "/dashboard/orders", label: "Orders" }} />
        <EmptyState title="This order doesn't exist" />
      </>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const move = async (status) => {
    setBusy(true);
    try {
      const next = await api(`/api/admin/orders/${order.id}/status`, { method: "PATCH", body: { status } });
      setData(next);
      notify.success(`${order.orderNumber} is now ${ORDER_STATUS[status].label.toLowerCase()}`);
    } finally {
      setBusy(false);
    }
  };
  const ask = (status) => (status === "CANCELLED" || status === "REFUNDED" ? setConfirm(status) : move(status).catch(() => {}));
  const nextSteps = NEXT_STATUS[order.status] ?? [];

  return (
    <>
      <PageHeader title={order.orderNumber} description={`Placed ${formatDateTime(order.createdAt)}`} back={{ href: "/dashboard/orders", label: "Orders" }}>
        <StatusBadge status={order.status} />
      </PageHeader>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Panel title="Items">
            <ul className="space-y-3">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{i.quantity} × {i.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[i.colorName, i.selectedSize !== "ONE_SIZE" ? `Size ${i.selectedSize}` : null, STYLE_LABELS[i.selectedStyle], SHAYLA_LABELS[i.shaylaType], i.sku].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums">{formatPrice(i.lineTotal)}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(i.unitPrice)} each</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 pt-3 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {Number(order.discountAmount) > 0 ? <Row label="Discount" value={`− ${formatPrice(order.discountAmount)}`} /> : null}
              <Row label="Shipping" value={Number(order.shippingFee) === 0 ? "Free" : formatPrice(order.shippingFee)} />
              <Row label="Total" value={formatPrice(order.total)} strong />
            </dl>
          </Panel>

          <Panel title="Move this order along">
            {nextSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground">This order is finished ({ORDER_STATUS[order.status].label.toLowerCase()}); it can't change any more.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {nextSteps.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy}
                      onClick={() => ask(s)}
                      className={cn(
                        "h-9 rounded-md px-4 text-sm disabled:opacity-50",
                        s === "CANCELLED" || s === "REFUNDED" ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300" : "bg-foreground text-background hover:opacity-90",
                      )}
                    >
                      {s === "CANCELLED" ? "Cancel order" : s === "REFUNDED" ? "Refund" : `Mark as ${ORDER_STATUS[s].label.toLowerCase()}`}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">PAID → PROCESSING → SHIPPED → DELIVERED. Cancelling or refunding puts the pieces back in stock.</p>
              </>
            )}
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Customer">
            {customer.loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : customer.data ? (
              <div className="space-y-1 text-sm">
                <a href={`/dashboard/customers/${customer.data.id}`} className="font-medium hover:underline">{customer.data.name}</a>
                <p className="text-muted-foreground">{customer.data.email}</p>
                <p className="text-xs text-muted-foreground">{customer.data.orderCount} orders · {formatPrice(customer.data.totalSpent)} spent</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Customer #{order.userId}</p>
            )}
          </Panel>
          <Panel title="Delivery">
            <div className="space-y-0.5 text-sm">
              <p>{order.shippingName}</p>
              <p className="text-muted-foreground">{order.shippingAddress}</p>
              <p className="text-muted-foreground">{[order.shippingCity, order.shippingCountry].filter(Boolean).join(", ")}</p>
            </div>
          </Panel>
          {order.payment ? (
            <Panel title="Payment (simulated)">
              <div className="space-y-0.5 text-sm">
                <p>{PAYMENT_LABELS[order.payment.method]}{order.payment.cardLast4 ? ` ending ${order.payment.cardLast4}` : ""}</p>
                <p className="text-muted-foreground">{order.payment.status.toLowerCase()} · {formatPrice(order.payment.amount)}</p>
                <p className="font-mono text-xs text-muted-foreground">{order.payment.reference}</p>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm === "REFUNDED" ? `Refund ${order.orderNumber}?` : `Cancel ${order.orderNumber}?`}
        message="The payment is marked refunded and every piece goes back on the shelf. This can't be undone."
        confirmLabel={confirm === "REFUNDED" ? "Refund order" : "Cancel order"}
        danger
        onConfirm={() => move(confirm)}
      />
    </>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={cn("flex justify-between", strong && "pt-1 text-base font-medium")}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS, lineOptions } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** The coloured status pill (Paid, On its way, Delivered...). */
export function StatusPill({ status }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: "bg-zinc-100" };
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider", s.tone)}>{s.label}</span>;
}

/** The lines on a receipt: a snapshot of what was bought, at the price paid. */
export function OrderLines({ items }) {
  return (
    <ul className="space-y-4">
      {items.map((i) => (
        <li key={i.id} className="flex justify-between gap-4 text-sm">
          <div className="min-w-0">
            <p className="truncate">
              {i.quantity} × {i.productName}
            </p>
            <p className="text-xs text-zinc-500">{[i.colorName, lineOptions(i), `${formatPrice(i.unitPrice)} each`].filter(Boolean).join(" · ")}</p>
          </div>
          <p className="shrink-0">{formatPrice(i.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }) {
  return (
    <dl className="mt-6 space-y-1.5 pt-4 text-sm">
      <Row label="Subtotal" value={formatPrice(order.subtotal)} />
      {Number(order.discountAmount) > 0 ? <Row label="Discount" value={`− ${formatPrice(order.discountAmount)}`} /> : null}
      <Row label="Shipping" value={Number(order.shippingFee) === 0 ? "Free" : formatPrice(order.shippingFee)} />
      <Row label="Total" value={formatPrice(order.total)} strong />
    </dl>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={cn("flex justify-between", strong && "pt-1 text-base font-medium")}>
      <dt className={strong ? "" : "text-zinc-600"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Back link used on the account sub-pages. */
export function BackLink({ href, children }) {
  return (
    <Link href={href} className="text-xs text-zinc-500 hover:text-black">
      ← {children}
    </Link>
  );
}

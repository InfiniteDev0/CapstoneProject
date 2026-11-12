"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { EmptyState, ErrorState, PageHeader, Pager, StatusBadge, TableSkeleton, fieldClass } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";
import { ORDER_STATUS, formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Every order, newest first: filter by status, search by order number, name or email. */
export default function OrdersPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const params = new URLSearchParams({ page: String(page), size: "15" });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  const { data, loading, error, reload } = useApi(`/api/admin/orders?${params}`);

  return (
    <>
      <PageHeader title="Orders" description="Click an order to see its lines and move it along." />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(0); }} className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, name or email" className={cn(fieldClass, "bg-card pl-9")} />
        </form>
        <div className="flex flex-wrap gap-1">
          {[["", "All"], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])].map(([value, label]) => (
            <button key={value} type="button" onClick={() => { setStatus(value); setPage(0); }} className={cn("rounded-full px-3 py-1.5 text-xs transition-colors", status === value ? "bg-foreground text-background" : "bg-card hover:bg-accent")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <TableSkeleton />
      ) : data.items.length === 0 ? (
        <EmptyState title="No orders found" message={status || search ? "Try another filter." : "Orders appear here as soon as customers check out."} />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-normal">Order</th>
                <th className="px-4 py-3 font-normal">Customer</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">Items</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
                <th className="hidden px-4 py-3 font-normal md:table-cell">Country</th>
                <th className="hidden px-4 py-3 font-normal lg:table-cell">Placed</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} onClick={() => router.push(`/dashboard/orders/${o.id}`)} className="cursor-pointer hover:bg-muted/60">
                  <td className="px-4 py-2.5 font-medium">{o.orderNumber}</td>
                  <td className="px-4 py-2.5">
                    <p>{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.itemCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(o.total)}</td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">{o.shippingCountry}</td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground lg:table-cell">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data ? <Pager page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPage={setPage} /> : null}
    </>
  );
}

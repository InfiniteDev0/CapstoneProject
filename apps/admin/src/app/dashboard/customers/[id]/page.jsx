"use client";

import { use } from "react";
import Link from "next/link";
import { EmptyState, ErrorState, PageHeader, Panel, StatusBadge, TableSkeleton } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";
import { formatDate, formatPrice, titleCase } from "@/lib/format";

/** One customer: who they are, how they shop, their devices and orders (the churn model's inputs). */
export default function CustomerPage({ params }) {
  const { id } = use(params);
  const { data: c, loading, error, reload } = useApi(`/api/admin/customers/${id}`);
  const orders = useApi(c ? `/api/admin/orders?search=${encodeURIComponent(c.email)}&size=10` : null);

  if (loading) return <TableSkeleton rows={8} />;
  if (error?.status === 404) {
    return (
      <>
        <PageHeader title="Customer not found" back={{ href: "/dashboard/customers", label: "Customers" }} />
        <EmptyState title="This customer doesn't exist" />
      </>
    );
  }
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const facts = [
    ["Email", c.email],
    ["Phone", c.phone],
    ["Country", [c.city, c.country].filter(Boolean).join(", ")],
    ["Gender", c.gender ? titleCase(c.gender) : null],
    ["Date of birth", c.dateOfBirth ? formatDate(c.dateOfBirth) : null],
    ["Loves", c.preferredCategories?.length ? c.preferredCategories.map(titleCase).join(", ") : null],
    ["Last seen", formatDate(c.lastLoginAt)],
  ];

  return (
    <>
      <PageHeader title={c.name} description={`Customer since ${formatDate(c.createdAt)} · ${c.tenureDays} days`} back={{ href: "/dashboard/customers", label: "Customers" }} />
      <div className="mb-3 grid gap-3 sm:grid-cols-4">
        <Fact label="Orders" value={c.orderCount} />
        <Fact label="Total spent" value={formatPrice(c.totalSpent)} />
        <Fact label="Devices" value={c.deviceCount} />
        <Fact label="Churn risk" value="—" hint="Phase 7" />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Profile">
          <dl className="space-y-2 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Devices">
          {c.devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No devices recorded.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {c.devices.map((d, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{titleCase(d.deviceType)} · {[d.browser, d.os].filter(Boolean).join(" on ") || "unknown"}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(d.lastSeen)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Orders">
          {orders.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !orders.data || orders.data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="space-y-1">
              {orders.data.items.map((o) => (
                <li key={o.id}>
                  <Link href={`/dashboard/orders/${o.id}`} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <span>{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                    <span className="tabular-nums">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Fact({ label, value, hint }) {
  return (
    <div className="rounded-lg bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

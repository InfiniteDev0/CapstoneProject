"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DollarSign, Receipt, ShieldAlert, UserCheck, Users } from "lucide-react";
import { ErrorState, Panel, StatusBadge } from "@/components/admin/ui-bits";
import { useAdminAuth } from "@/components/providers/admin-auth";
import { StatCard, StatCardSkeleton } from "@/components/stat-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { formatDate, formatNumber, formatPrice, titleCase } from "@/lib/format";

const salesConfig = { revenue: { label: "Revenue", color: "var(--chart-4)" } };
const categoryConfig = { revenue: { label: "Revenue", color: "var(--chart-3)" } };

/** The manager's overview: the numbers the spec asks for, from GET /api/admin/dashboard/stats. */
export default function DashboardPage() {
  const { user } = useAdminAuth();
  const stats = useApi("/api/admin/dashboard/stats");
  const recent = useApi("/api/admin/orders?size=5");
  const lowStock = useApi("/api/admin/inventory?atOrBelow=5");
  const s = stats.data;

  const cards = s
    ? [
        { id: "sales", badge: "Total sales", icon: DollarSign, value: formatPrice(s.totalSales), caption: `Average order ${formatPrice(s.averageOrderValue)}`, tone: "green", action: { label: "Orders", href: "/dashboard/orders" } },
        { id: "orders", badge: "Orders", icon: Receipt, value: formatNumber(s.orderCount), caption: "Not cancelled or refunded", tone: "blue", action: { label: "Orders", href: "/dashboard/orders" } },
        { id: "customers", badge: "Customers", icon: Users, value: formatNumber(s.totalCustomers), caption: `${s.newCustomersLast30Days} new in the last 30 days`, tone: "violet", action: { label: "Customers", href: "/dashboard/customers" } },
        { id: "active", badge: "Active users", icon: UserCheck, value: formatNumber(s.activeUsers), caption: `Logged in during the last ${s.activeWindowDays} days`, tone: "teal", action: { label: "Customers", href: "/dashboard/customers" } },
        { id: "churn", badge: "Churn rate", icon: ShieldAlert, value: s.churnRate == null ? "—" : `${Math.round(s.churnRate * 100)}%`, caption: s.churnRate == null ? "Activates in Phase 7 (AI)" : "Customers predicted to leave", tone: "red", action: { label: "Churn Risk", href: "/dashboard/churn" } },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Hi there, {user?.name?.split(" ")[0] ?? "Admin"}</h1>
        <p className="text-sm text-muted-foreground">Here is how Vela Noire is doing.</p>
      </div>

      {stats.error ? (
        <ErrorState error={stats.error} onRetry={stats.reload} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.loading ? Array.from({ length: 5 }, (_, i) => <StatCardSkeleton key={i} />) : cards.map(({ id, ...c }) => <StatCard key={id} {...c} />)}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-5">
        <Panel title="Sales by month" className="lg:col-span-3">
          {stats.loading ? (
            <Skeleton className="h-64 w-full" />
          ) : !s || s.salesByMonth.length === 0 ? (
            <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">No sales in the last 6 months yet.</p>
          ) : (
            <ChartContainer config={salesConfig} className="h-64 w-full">
              <BarChart data={s.salesByMonth.map((m) => ({ ...m, revenue: Number(m.revenue), label: monthLabel(m.month) }))} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `$${formatNumber(v)}`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatPrice(v)} />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
              </BarChart>
            </ChartContainer>
          )}
        </Panel>

        <Panel title="Top categories" className="lg:col-span-2">
          {stats.loading ? (
            <Skeleton className="h-64 w-full" />
          ) : !s || s.topCategories.length === 0 ? (
            <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ChartContainer config={categoryConfig} className="h-64 w-full">
              <BarChart data={s.topCategories.map((c) => ({ ...c, revenue: Number(c.revenue), label: titleCase(c.category) }))} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={84} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v, _n, item) => `${formatPrice(v)} · ${item.payload.unitsSold} sold`} />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
              </BarChart>
            </ChartContainer>
          )}
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Recent orders" action={<Link href="/dashboard/orders" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>}>
          {recent.loading ? (
            <Skeleton className="h-40 w-full" />
          ) : recent.error ? (
            <p className="text-sm text-muted-foreground">Couldn&apos;t load orders.</p>
          ) : recent.data.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="space-y-1">
              {recent.data.items.map((o) => (
                <li key={o.id}>
                  <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted">
                    <span className="font-medium">{o.orderNumber}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{o.customerName}</span>
                    <StatusBadge status={o.status} />
                    <span className="w-20 text-right tabular-nums">{formatPrice(o.total)}</span>
                    <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">{formatDate(o.createdAt, { day: "numeric", month: "short" })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Low stock" action={<Link href="/dashboard/products/inventory" className="text-xs text-muted-foreground hover:text-foreground">Restock</Link>}>
          {lowStock.loading ? (
            <Skeleton className="h-40 w-full" />
          ) : lowStock.error ? (
            <p className="text-sm text-muted-foreground">Couldn&apos;t load stock.</p>
          ) : lowStock.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Every colour has more than 5 pieces.</p>
          ) : (
            <ul className="space-y-1">
              {lowStock.data.slice(0, 6).map((r) => (
                <li key={r.sku} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: r.colorHex ?? "#ccc" }} />
                  <span className="min-w-0 flex-1 truncate">{r.productName} <span className="text-muted-foreground">· {r.colorName}</span></span>
                  <span className={r.stock === 0 ? "text-red-600" : "text-amber-700 dark:text-amber-400"}>{r.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** "2026-10" → "Oct 26" */
function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
}

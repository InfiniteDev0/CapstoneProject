"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { EmptyState, ErrorState, PageHeader, Pager, TableSkeleton, fieldClass } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const SORTS = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["name", "Name A–Z"],
  ["last_login", "Last seen"],
];

/** Customers with what they've spent, how often they ordered and how many devices they use. */
export default function CustomersPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);

  const params = new URLSearchParams({ page: String(page), size: "15", sort });
  if (search) params.set("search", search);
  const { data, loading, error, reload } = useApi(`/api/admin/customers?${params}`);

  return (
    <>
      <PageHeader title="Customers" description="Churn risk joins this list in Phase 7, once the AI can predict it." />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(0); }} className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email, press Enter" className={cn(fieldClass, "bg-card pl-9")} />
        </form>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }} className={cn(fieldClass, "w-auto bg-card")} aria-label="Sort">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <TableSkeleton />
      ) : data.items.length === 0 ? (
        <EmptyState title="No customers found" message={search ? "Try another name or email." : "Customers appear here when they create an account."} />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-normal">Customer</th>
                <th className="hidden px-4 py-3 font-normal md:table-cell">Country</th>
                <th className="px-4 py-3 text-right font-normal">Orders</th>
                <th className="px-4 py-3 text-right font-normal">Spent</th>
                <th className="px-4 py-3 text-right font-normal">Devices</th>
                <th className="hidden px-4 py-3 font-normal lg:table-cell">Joined</th>
                <th className="hidden px-4 py-3 font-normal lg:table-cell">Last seen</th>
                <th className="px-4 py-3 font-normal">Churn risk</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} onClick={() => router.push(`/dashboard/customers/${c.id}`)} className="cursor-pointer hover:bg-muted/60">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="hidden px-4 py-2.5 md:table-cell">{c.country ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.orderCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{c.deviceCount}</td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground lg:table-cell">{formatDate(c.createdAt)}</td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground lg:table-cell">{formatDate(c.lastLoginAt)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.churnRisk ?? "Phase 7"}</td>
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

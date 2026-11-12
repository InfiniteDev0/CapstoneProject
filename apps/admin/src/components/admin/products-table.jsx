"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { EmptyState, ErrorState, Pager, StatusBadge, TableSkeleton, fieldClass } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";
import { imageUrl } from "@/lib/api";
import { PRODUCT_STATUS, formatDate, formatPrice, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The product table (all statuses). Used by Products and by each Collection page. */
export function ProductsTable({ collection }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const categories = useApi("/api/store/categories");

  const params = new URLSearchParams({ page: String(page), size: "15" });
  if (search) params.set("q", search);
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  if (collection) params.set("collection", collection);
  const { data, loading, error, reload } = useApi(`/api/admin/products?${params}`);

  const reset = (fn) => (e) => {
    fn(e.target.value);
    setPage(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
            setPage(0);
          }}
          className="relative w-full max-w-xs"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or SKU, press Enter" className={cn(fieldClass, "bg-card pl-9")} />
        </form>
        <select value={category} onChange={reset(setCategory)} className={cn(fieldClass, "w-auto bg-card")} aria-label="Category">
          <option value="">All categories</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select value={status} onChange={reset(setStatus)} className={cn(fieldClass, "w-auto bg-card")} aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(PRODUCT_STATUS).map(([v, s]) => (
            <option key={v} value={v}>{s.label}</option>
          ))}
        </select>
        <Link href="/dashboard/products/new" className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm text-background hover:opacity-90">
          <Plus className="size-4" /> Add product
        </Link>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <TableSkeleton />
      ) : data.items.length === 0 ? (
        <EmptyState title="No products found" message={search || category || status ? "Try other filters." : "Add the first product to the catalogue."} />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-normal">Product</th>
                <th className="px-4 py-3 font-normal">Category</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">Price</th>
                <th className="px-4 py-3 text-right font-normal">Stock</th>
                <th className="hidden px-4 py-3 font-normal lg:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} onClick={() => router.push(`/dashboard/products/${p.id}`)} className="cursor-pointer transition-colors hover:bg-muted/60">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.image ? <img src={imageUrl(p.image)} alt="" className="size-full object-cover" /> : null}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.collection ? titleCase(p.collection) : "No collection"} · {p.variantCount} colour{p.variantCount === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">{titleCase(p.category)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={p.status} kind="product" /></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(p.basePrice)}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", p.lowStock && "text-amber-700 dark:text-amber-400")}>
                    {p.totalStock}
                    {p.lowStock ? <span className="ml-1 text-[10px] uppercase">low</span> : null}
                  </td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground lg:table-cell">{formatDate(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data ? <Pager page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} onPage={setPage} /> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState, ErrorState, PageHeader, StatusBadge, TableSkeleton, fieldClass } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { titleCase } from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

const VIEWS = [
  { value: "5", label: "Low stock (5 or fewer)" },
  { value: "0", label: "Sold out" },
  { value: "", label: "Every colour" },
];

/** The stock room: every colour's shelf count, lowest first, with a quick restock box on each row. */
export default function InventoryPage() {
  const [view, setView] = useState("5");
  const { data, loading, error, reload, setData } = useApi(`/api/admin/inventory${view === "" ? "" : `?atOrBelow=${view}`}`);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(null);

  const restock = async (row) => {
    const value = Number(drafts[row.sku]);
    if (!Number.isInteger(value) || value < 0) return notify.error("Stock must be a whole number, 0 or more");
    setSaving(row.sku);
    try {
      await api(`/api/admin/products/${row.productId}/variants/${row.sku}/stock`, { method: "PUT", body: { stock: value } });
      setData((rows) => rows.map((r) => (r.sku === row.sku ? { ...r, stock: value } : r)));
      setDrafts((d) => ({ ...d, [row.sku]: "" }));
      notify.success(`${row.productName} · ${row.colorName}: ${value} on the shelf`);
    } catch {
      // toast already shown
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <PageHeader title="Inventory" description="Stock per colour, lowest first. Type a new count and press Enter to restock.">
        <select value={view} onChange={(e) => setView(e.target.value)} className={cn(fieldClass, "w-auto bg-card")} aria-label="Which colours">
          {VIEWS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
      </PageHeader>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <TableSkeleton />
      ) : data.length === 0 ? (
        <EmptyState title={view === "0" ? "Nothing is sold out" : "Stock looks healthy"} message="Every colour has more than 5 pieces on the shelf." />
      ) : (
        <div className="overflow-x-auto rounded-lg bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-normal">Product</th>
                <th className="px-4 py-3 font-normal">Colour</th>
                <th className="px-4 py-3 font-normal">SKU</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 text-right font-normal">On the shelf</th>
                <th className="px-4 py-3 font-normal">Restock to</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.sku} className="hover:bg-muted/60">
                  <td className="px-4 py-2">
                    <Link href={`/dashboard/products/${r.productId}`} className="font-medium hover:underline">{r.productName}</Link>
                    <p className="text-xs text-muted-foreground">{titleCase(r.category)}</p>
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: r.colorHex ?? "#ccc" }} />{r.colorName}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{r.sku}</td>
                  <td className="px-4 py-2"><StatusBadge status={r.status} kind="product" /></td>
                  <td className={cn("px-4 py-2 text-right tabular-nums font-medium", r.stock === 0 ? "text-red-600" : r.stock <= 5 ? "text-amber-700 dark:text-amber-400" : "")}>{r.stock}</td>
                  <td className="px-4 py-2">
                    <form onSubmit={(e) => { e.preventDefault(); restock(r); }} className="flex gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={drafts[r.sku] ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [r.sku]: e.target.value }))}
                        placeholder={String(Math.max(r.stock, 10))}
                        className={cn(fieldClass, "w-20")}
                        aria-label={`New stock for ${r.productName} ${r.colorName}`}
                      />
                      <button type="submit" disabled={saving === r.sku || drafts[r.sku] === undefined || drafts[r.sku] === ""} className="h-9 rounded-md bg-foreground px-3 text-xs text-background disabled:opacity-30">
                        {saving === r.sku ? "…" : "Save"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

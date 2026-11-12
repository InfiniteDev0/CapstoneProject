"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductGrid } from "@/components/shop/ProductCard";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { useApi } from "@/hooks/use-api";
import { titleCase } from "@/lib/format";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const SEASONS = ["SPRING", "SUMMER", "AUTUMN", "WINTER"];
const SORTS = [
  ["newest", "Newest"],
  ["popular", "Most loved"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["rating", "Top rated"],
];

/**
 * The shop floor: filters on the left, pieces on the right.
 * Every choice is written into the URL (?category=abaya&sort=price_asc...), so a refresh,
 * the back button or a shared link keeps exactly what you picked.
 */
export default function ShopBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const f = {
    category: params.get("category") ?? "",
    collection: params.get("collection") ?? "",
    season: params.get("season") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    tags: params.getAll("tags"),
    q: params.get("q") ?? "",
    sort: params.get("sort") ?? "",
    page: Math.max(0, Number(params.get("page") ?? 0) || 0),
  };

  const apiQuery = useMemo(() => {
    const p = new URLSearchParams(params.toString());
    p.set("size", String(PAGE_SIZE));
    return p.toString();
  }, [params]);

  const products = useApi(`/api/store/products?${apiQuery}`);
  const categories = useApi("/api/store/categories");
  const collections = useApi("/api/store/collections");

  /** Change some filters; any change except paging sends you back to page 1. */
  const update = (changes) => {
    const p = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      p.delete(key);
      if (Array.isArray(value)) value.forEach((v) => p.append(key, v));
      else if (value !== "" && value !== null && value !== undefined) p.set(key, String(value));
    }
    if (!("page" in changes)) p.delete("page");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    if ("page" in changes) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Search box and price boxes: typed locally, applied on Enter / blur
  const [q, setQ] = useState(f.q);
  const [minPrice, setMinPrice] = useState(f.minPrice);
  const [maxPrice, setMaxPrice] = useState(f.maxPrice);
  useEffect(() => setQ(f.q), [f.q]);
  useEffect(() => setMinPrice(f.minPrice), [f.minPrice]);
  useEffect(() => setMaxPrice(f.maxPrice), [f.maxPrice]);

  const submitSearch = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (query) track("SEARCH", { query, page: "/shop" });
    update({ q: query, sort: query ? "" : f.sort });
  };

  const collectionName = collections.data?.find((c) => c.slug === f.collection)?.name;
  const categoryName = categories.data?.find((c) => c.slug === f.category)?.name;
  const heading = f.q
    ? `Results for “${f.q}”`
    : [f.season && f.collection === "seasonal" ? titleCase(f.season) : null, collectionName, categoryName]
        .filter(Boolean)
        .join(" · ") || "All Pieces";

  // Tag chips: the tags found in the current results, plus any already chosen
  const tagOptions = useMemo(() => {
    const counts = new Map();
    for (const p of products.data?.items ?? []) for (const t of p.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t]) => t);
    return [...new Set([...f.tags, ...top])];
  }, [products.data, f.tags]);

  const active = [
    f.category && { key: "category", label: categoryName ?? f.category },
    f.collection && { key: "collection", label: collectionName ?? f.collection },
    f.season && { key: "season", label: titleCase(f.season) },
    f.minPrice && { key: "minPrice", label: `From $${f.minPrice}` },
    f.maxPrice && { key: "maxPrice", label: `Up to $${f.maxPrice}` },
    ...f.tags.map((t) => ({ key: "tags", value: t, label: `#${t}` })),
    f.q && { key: "q", label: `“${f.q}”` },
  ].filter(Boolean);

  const removeChip = (chip) =>
    update(chip.key === "tags" ? { tags: f.tags.filter((t) => t !== chip.value) } : { [chip.key]: "" });

  const data = products.data;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-28">
      {/* Header: title, count, search, sort */}
      <div className="flex flex-col gap-5 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Vela Noire</p>
          <h1 className="text-3xl">{heading}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {products.loading ? "Finding pieces…" : data ? `${data.totalItems} piece${data.totalItems === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={submitSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search abayas, oud, velvet…"
              aria-label="Search the collection"
              className="h-10 w-64 rounded-full bg-zinc-100 pl-9 pr-4 text-sm outline-none focus:bg-zinc-200/70"
            />
          </form>
          <select
            value={f.sort || (f.q ? "relevance" : "newest")}
            onChange={(e) => update({ sort: e.target.value === "relevance" ? "" : e.target.value })}
            aria-label="Sort by"
            className="h-10 rounded-full bg-zinc-100 px-4 text-sm outline-none"
          >
            {f.q ? <option value="relevance">Best match</option> : null}
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="flex h-10 items-center gap-2 rounded-full bg-zinc-100 px-4 text-sm lg:hidden"
          >
            <SlidersHorizontal className="size-4" /> Filters
          </button>
        </div>
      </div>

      {/* Chosen filters, each removable */}
      {active.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {active.map((chip) => (
            <button
              key={`${chip.key}-${chip.value ?? ""}`}
              type="button"
              onClick={() => removeChip(chip)}
              className="flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs text-white"
            >
              {chip.label} <X className="size-3" />
            </button>
          ))}
          <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="text-xs underline underline-offset-4">
            Clear all
          </button>
        </div>
      ) : null}

      <div className="flex gap-10">
        {/* Filters */}
        <aside className={cn("w-full shrink-0 space-y-8 lg:block lg:w-56", showFilters ? "block" : "hidden")}>
          <FilterGroup title="Category">
            <Option label="All" active={!f.category} onClick={() => update({ category: "" })} />
            {(categories.data ?? []).map((c) => (
              <Option key={c.slug} label={c.name} active={f.category === c.slug} onClick={() => update({ category: c.slug })} />
            ))}
          </FilterGroup>

          <FilterGroup title="Collection">
            <Option label="All" active={!f.collection} onClick={() => update({ collection: "", season: "" })} />
            {(collections.data ?? []).map((c) => (
              <Option
                key={c.slug}
                label={c.name}
                active={f.collection === c.slug}
                onClick={() => update({ collection: c.slug, season: c.slug === "seasonal" ? f.season : "" })}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Season">
            <Option label="Any" active={!f.season} onClick={() => update({ season: "" })} />
            {SEASONS.map((s) => (
              <Option key={s} label={titleCase(s)} active={f.season === s} onClick={() => update({ season: s, collection: "seasonal" })} />
            ))}
          </FilterGroup>

          <FilterGroup title="Price (USD)">
            <div className="flex items-center gap-2">
              <PriceBox value={minPrice} onChange={setMinPrice} onApply={() => update({ minPrice })} placeholder="Min" />
              <span className="text-zinc-400">–</span>
              <PriceBox value={maxPrice} onChange={setMaxPrice} onApply={() => update({ maxPrice })} placeholder="Max" />
            </div>
          </FilterGroup>

          {tagOptions.length > 0 ? (
            <FilterGroup title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tagOptions.map((t) => {
                  const on = f.tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update({ tags: on ? f.tags.filter((x) => x !== t) : [...f.tags, t] })}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs transition-colors",
                        on ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200",
                      )}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>
          ) : null}
        </aside>

        {/* Results */}
        <div className={cn("min-w-0 flex-1", showFilters && "hidden lg:block")}>
          {products.error ? (
            <ErrorState message={products.error.status === 400 ? products.error.message : undefined} onRetry={products.reload} />
          ) : !products.loading && data.items.length === 0 ? (
            <EmptyState
              title="No pieces match these filters"
              message="Try removing a filter or searching for something else."
              action={{ label: "See all pieces", href: "/shop" }}
            />
          ) : (
            <>
              <ProductGrid products={data?.items ?? []} loading={products.loading} count={PAGE_SIZE} className="grid-cols-2 md:grid-cols-3" />
              {totalPages > 1 ? (
                <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pages">
                  <PageButton disabled={f.page === 0} onClick={() => update({ page: f.page - 1 })} label="Previous page">
                    <ChevronLeft className="size-4" />
                  </PageButton>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PageButton key={i} active={i === f.page} onClick={() => update({ page: i })} label={`Page ${i + 1}`}>
                      {i + 1}
                    </PageButton>
                  ))}
                  <PageButton disabled={f.page >= totalPages - 1} onClick={() => update({ page: f.page + 1 })} label="Next page">
                    <ChevronRight className="size-4" />
                  </PageButton>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <h2 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">{title}</h2>
      <div className="flex flex-col items-start gap-1.5">{children}</div>
    </div>
  );
}

function Option({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("text-sm transition-colors", active ? "font-semibold text-black underline underline-offset-4" : "text-zinc-600 hover:text-black")}
    >
      {label}
    </button>
  );
}

function PriceBox({ value, onChange, onApply, placeholder }) {
  return (
    <input
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      aria-label={`${placeholder} price`}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
      onBlur={onApply}
      onKeyDown={(e) => e.key === "Enter" && onApply()}
      className="h-9 w-20 rounded-md bg-zinc-100 px-2 text-sm outline-none focus:bg-zinc-200/70"
    />
  );
}

function PageButton({ children, active, disabled, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-sm transition-colors disabled:opacity-30",
        active ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200",
      )}
    >
      {children}
    </button>
  );
}

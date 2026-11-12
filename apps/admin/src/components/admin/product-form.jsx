"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageHeader, Panel, StatusBadge, fieldClass } from "@/components/admin/ui-bits";
import { useApi } from "@/hooks/use-api";
import { SHOP_URL, api, imageUrl } from "@/lib/api";
import { PRODUCT_STATUS, SHOP_IMAGES, STYLE_LABELS } from "@/lib/format";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ABAYA_SIZES = "XS, S, M, L, XL, 2XL, 3XL, Custom";
const ABAYA_LENGTHS = "52, 54, 56, 58, 60";
const list = (text) => text.split(",").map((s) => s.trim()).filter(Boolean);

const blankVariant = () => ({ key: crypto.randomUUID(), sku: "", colorName: "", colorHex: "#111111", stock: "0", priceOverride: "", images: [], isDefault: false });

/** Product (MongoDB document) → form fields (strings for inputs). */
function toForm(p) {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    description: p?.description ?? "",
    story: p?.story ?? "",
    category: p?.category ?? "abaya",
    collection: p?.collection ?? "",
    season: p?.season ?? "",
    seasonalLine: p?.seasonalLine ?? "",
    basePrice: p?.basePrice != null ? String(p.basePrice) : "",
    discountPercent: String(p?.discountPercent ?? 0),
    status: p?.status ?? "IN_PRODUCTION",
    isNew: Boolean(p?.isNew),
    isBestSeller: Boolean(p?.isBestSeller),
    isLimitedEdition: Boolean(p?.isLimitedEdition),
    tags: (p?.tags ?? []).join(", "),
    images: p?.images ?? [],
    abaya: {
      fabric: p?.abaya?.fabric ?? "",
      styles: p?.abaya?.styles ?? ["OPEN_FRONT"],
      sizes: (p?.abaya?.sizes ?? list(ABAYA_SIZES)).join(", "),
      lengths: (p?.abaya?.lengths ?? list(ABAYA_LENGTHS)).join(", "),
      shaylaIncluded: p?.abaya?.shaylaIncluded ?? true,
    },
    perfume: {
      volumeMl: String(p?.perfume?.volumeMl ?? 50),
      top: (p?.perfume?.notes?.top ?? []).join(", "),
      heart: (p?.perfume?.notes?.heart ?? []).join(", "),
      base: (p?.perfume?.notes?.base ?? []).join(", "),
    },
    variants: (p?.variants?.length ? p.variants : [{ ...blankVariant(), isDefault: true }]).map((v) => ({
      key: v.key ?? v.sku ?? crypto.randomUUID(),
      sku: v.sku ?? "",
      colorName: v.colorName ?? "",
      colorHex: v.colorHex ?? "#111111",
      stock: String(v.stock ?? 0),
      priceOverride: v.priceOverride != null ? String(v.priceOverride) : "",
      images: v.images ?? [],
      isDefault: Boolean(v.isDefault),
    })),
  };
}

/** Form fields → the ProductRequest Java expects. */
function toRequest(f) {
  return {
    name: f.name.trim(),
    slug: f.slug.trim() || undefined,
    description: f.description.trim() || undefined,
    story: f.story.trim() || undefined,
    category: f.category,
    collection: f.collection || null,
    season: f.season || undefined,
    seasonalLine: f.seasonalLine.trim() || undefined,
    basePrice: Number(f.basePrice),
    discountPercent: Number(f.discountPercent || 0),
    status: f.status,
    isNew: f.isNew,
    isBestSeller: f.isBestSeller,
    isLimitedEdition: f.isLimitedEdition,
    tags: list(f.tags),
    images: f.images,
    abaya: f.category === "abaya"
      ? { fabric: f.abaya.fabric || undefined, styles: f.abaya.styles, sizes: list(f.abaya.sizes), lengths: list(f.abaya.lengths), shaylaIncluded: f.abaya.shaylaIncluded }
      : undefined,
    perfume: f.category === "perfume"
      ? { volumeMl: Number(f.perfume.volumeMl || 50), notes: { top: list(f.perfume.top), heart: list(f.perfume.heart), base: list(f.perfume.base) } }
      : undefined,
    variants: f.variants.map((v) => ({
      sku: v.sku.trim().toUpperCase(),
      colorName: v.colorName.trim(),
      colorHex: v.colorHex || undefined,
      stock: Number(v.stock || 0),
      priceOverride: v.priceOverride === "" ? undefined : Number(v.priceOverride),
      images: v.images,
      isDefault: v.isDefault,
    })),
  };
}

/**
 * Create or edit a product. `product` is the loaded document when editing (null for new).
 * Saving sends the whole product (PUT) or a new one (POST); Java + MongoDB's validator check it.
 */
export function ProductForm({ product }) {
  const router = useRouter();
  const editing = Boolean(product);
  const categories = useApi("/api/store/categories");
  const collections = useApi("/api/store/collections");
  const [f, setF] = useState(() => toForm(product));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageInput, setImageInput] = useState("");
  useEffect(() => setF(toForm(product)), [product]);

  const set = (key) => (e) => setF((s) => ({ ...s, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const setNested = (group, key) => (e) =>
    setF((s) => ({ ...s, [group]: { ...s[group], [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value } }));
  const setVariant = (i, key, value) =>
    setF((s) => ({
      ...s,
      variants: s.variants.map((v, j) => (key === "isDefault" ? { ...v, isDefault: i === j } : j === i ? { ...v, [key]: value } : v)),
    }));
  const toggleImage = (src) => setF((s) => ({ ...s, images: s.images.includes(src) ? s.images.filter((x) => x !== src) : [...s.images, src] }));
  const seasonalLines = collections.data?.find((c) => c.slug === "seasonal")?.lines ?? [];

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim() || f.basePrice === "") return notify.error("Name and base price are required");
    if (f.variants.some((v) => !v.sku.trim() || !v.colorName.trim())) return notify.error("Every colour needs a SKU and a name");
    setSaving(true);
    try {
      const body = toRequest(f);
      const saved = editing
        ? await api(`/api/admin/products/${product.id}`, { method: "PUT", body })
        : await api("/api/admin/products", { method: "POST", body });
      notify.success(editing ? `${saved.name} saved` : `${saved.name} created`);
      if (editing) setF(toForm(saved));
      else router.replace(`/dashboard/products/${saved.id}`);
    } catch {
      // toast already shown (e.g. "That SKU or slug is already used")
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
    notify.success(`${product.name} deleted`);
    router.replace("/dashboard/products");
  };

  return (
    <form onSubmit={save}>
      <PageHeader
        title={editing ? f.name || "Product" : "Add product"}
        description={editing ? <span className="inline-flex items-center gap-2"><StatusBadge status={product.status} kind="product" /> {product.slug}</span> : "New products start In production, hidden from the shop, until you set them Live."}
        back={{ href: "/dashboard/products", label: "Products" }}
      >
        {editing && product.status === "LIVE" ? (
          <a href={`${SHOP_URL}/product/${product.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md bg-card px-3 text-sm hover:bg-accent">
            <ExternalLink className="size-4" /> View in shop
          </a>
        ) : null}
        {editing ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-card px-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="size-4" /> Delete
          </button>
        ) : null}
        <button type="submit" disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-4 text-sm text-background hover:opacity-90 disabled:opacity-50">
          <Check className="size-4" /> {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
        </button>
      </PageHeader>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Panel title="Details">
            <div className="grid gap-3 sm:grid-cols-2">
              <Labeled label="Name" className="sm:col-span-2"><input value={f.name} onChange={set("name")} className={fieldClass} required /></Labeled>
              <Labeled label="Slug (web address)" hint="Leave empty to make it from the name"><input value={f.slug} onChange={set("slug")} placeholder="velvet-moon-abaya" className={fieldClass} /></Labeled>
              <Labeled label="Tags" hint="Comma separated"><input value={f.tags} onChange={set("tags")} placeholder="winter, velvet, evening" className={fieldClass} /></Labeled>
              <Labeled label="Description" className="sm:col-span-2"><textarea value={f.description} onChange={set("description")} rows={3} className={cn(fieldClass, "h-auto py-2")} /></Labeled>
              <Labeled label="Story (shown in script on the product page)" className="sm:col-span-2"><textarea value={f.story} onChange={set("story")} rows={2} className={cn(fieldClass, "h-auto py-2")} /></Labeled>
            </div>
          </Panel>

          <Panel title="Photos" action={<span className="text-xs text-muted-foreground">Click to add or remove. First photo is the cover.</span>}>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {[...new Set([...SHOP_IMAGES, ...f.images])].map((src) => {
                const on = f.images.includes(src);
                return (
                  <button key={src} type="button" onClick={() => toggleImage(src)} className={cn("relative aspect-square overflow-hidden rounded-md bg-muted", on ? "ring-2 ring-foreground" : "opacity-60 hover:opacity-100")} title={src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl(src)} alt="" className="size-full object-cover" />
                    {on ? <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background">{f.images.indexOf(src) + 1}</span> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="…or paste an image URL (https://…) or a shop path (/assets/images/…)" className={fieldClass} />
              <button
                type="button"
                onClick={() => {
                  const v = imageInput.trim();
                  if (!v) return;
                  if (!/^https?:\/\//.test(v) && !v.startsWith("/")) return notify.error("Use a full URL or a path starting with /");
                  setF((s) => ({ ...s, images: s.images.includes(v) ? s.images : [...s.images, v] }));
                  setImageInput("");
                }}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-muted px-3 text-sm hover:bg-accent"
              >
                <ImagePlus className="size-4" /> Add
              </button>
            </div>
          </Panel>

          {f.category === "abaya" ? (
            <Panel title="Abaya details">
              <div className="grid gap-3 sm:grid-cols-2">
                <Labeled label="Fabric"><input value={f.abaya.fabric} onChange={setNested("abaya", "fabric")} placeholder="Velvet" className={fieldClass} /></Labeled>
                <Labeled label="Shayla">
                  <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={f.abaya.shaylaIncluded} onChange={setNested("abaya", "shaylaIncluded")} /> Matching shayla included</label>
                </Labeled>
                <Labeled label="Sizes" hint="Comma separated"><input value={f.abaya.sizes} onChange={setNested("abaya", "sizes")} className={fieldClass} /></Labeled>
                <Labeled label="Lengths (inches)" hint="Comma separated"><input value={f.abaya.lengths} onChange={setNested("abaya", "lengths")} className={fieldClass} /></Labeled>
                <Labeled label="Front styles" className="sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STYLE_LABELS).map(([v, l]) => {
                      const on = f.abaya.styles.includes(v);
                      return (
                        <button key={v} type="button" onClick={() => setF((s) => ({ ...s, abaya: { ...s.abaya, styles: on ? s.abaya.styles.filter((x) => x !== v) : [...s.abaya.styles, v] } }))} className={cn("rounded-full px-3 py-1.5 text-xs", on ? "bg-foreground text-background" : "bg-muted hover:bg-accent")}>
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </Labeled>
              </div>
            </Panel>
          ) : null}

          {f.category === "perfume" ? (
            <Panel title="Perfume details">
              <div className="grid gap-3 sm:grid-cols-4">
                <Labeled label="Volume (ml)"><input type="number" min="1" value={f.perfume.volumeMl} onChange={setNested("perfume", "volumeMl")} className={fieldClass} /></Labeled>
                <Labeled label="Top notes"><input value={f.perfume.top} onChange={setNested("perfume", "top")} placeholder="Saffron" className={fieldClass} /></Labeled>
                <Labeled label="Heart notes"><input value={f.perfume.heart} onChange={setNested("perfume", "heart")} placeholder="Rose" className={fieldClass} /></Labeled>
                <Labeled label="Base notes"><input value={f.perfume.base} onChange={setNested("perfume", "base")} placeholder="Oud, Amber" className={fieldClass} /></Labeled>
              </div>
            </Panel>
          ) : null}

          <Panel
            title="Colours & stock"
            action={
              <button type="button" onClick={() => setF((s) => ({ ...s, variants: [...s.variants, blankVariant()] }))} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Plus className="size-3.5" /> Add colour
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-normal">Default</th>
                    <th className="pb-2 font-normal">SKU</th>
                    <th className="pb-2 font-normal">Colour</th>
                    <th className="pb-2 font-normal">Swatch</th>
                    <th className="pb-2 font-normal">Stock</th>
                    <th className="pb-2 font-normal">Own price</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {f.variants.map((v, i) => (
                    <tr key={v.key}>
                      <td className="py-1 pr-2"><input type="radio" name="defaultVariant" checked={v.isDefault} onChange={() => setVariant(i, "isDefault", true)} aria-label="Default colour" /></td>
                      <td className="py-1 pr-2"><input value={v.sku} onChange={(e) => setVariant(i, "sku", e.target.value.toUpperCase())} placeholder="VN-ABY-MM-02-BLK" className={cn(fieldClass, "min-w-40")} /></td>
                      <td className="py-1 pr-2"><input value={v.colorName} onChange={(e) => setVariant(i, "colorName", e.target.value)} placeholder="Noir" className={cn(fieldClass, "min-w-28")} /></td>
                      <td className="py-1 pr-2"><input type="color" value={v.colorHex} onChange={(e) => setVariant(i, "colorHex", e.target.value)} className="h-9 w-12 cursor-pointer rounded-md bg-muted p-1" aria-label="Colour swatch" /></td>
                      <td className="py-1 pr-2"><input type="number" min="0" value={v.stock} onChange={(e) => setVariant(i, "stock", e.target.value)} className={cn(fieldClass, "w-20")} /></td>
                      <td className="py-1 pr-2"><input type="number" min="0" step="0.01" value={v.priceOverride} onChange={(e) => setVariant(i, "priceOverride", e.target.value)} placeholder="—" className={cn(fieldClass, "w-24")} /></td>
                      <td className="py-1">
                        <button type="button" disabled={f.variants.length === 1} onClick={() => setF((s) => ({ ...s, variants: s.variants.filter((_, j) => j !== i).map((x, j, arr) => (arr.some((y) => y.isDefault) ? x : { ...x, isDefault: j === 0 })) }))} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30" aria-label="Remove colour">
                          <X className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">SKUs look like VN-ABY-MM-02-BLK and must be unique across the catalogue. "Own price" overrides the base price for that colour.</p>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Status">
            <select value={f.status} onChange={set("status")} className={fieldClass}>
              {Object.entries(PRODUCT_STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">Only Live products can be bought. Sold out ones stay visible in the shop.</p>
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.isNew} onChange={set("isNew")} /> New</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.isBestSeller} onChange={set("isBestSeller")} /> Best seller</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.isLimitedEdition} onChange={set("isLimitedEdition")} /> Limited edition</label>
            </div>
          </Panel>

          <Panel title="Organisation">
            <div className="space-y-3">
              <Labeled label="Category">
                <select value={f.category} onChange={set("category")} className={fieldClass}>
                  {(categories.data ?? [{ slug: f.category, name: f.category }]).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Labeled>
              <Labeled label="Collection">
                <select value={f.collection} onChange={(e) => setF((s) => ({ ...s, collection: e.target.value, season: e.target.value === "seasonal" ? s.season : "", seasonalLine: e.target.value === "seasonal" ? s.seasonalLine : "" }))} className={fieldClass}>
                  <option value="">None</option>
                  {(collections.data ?? []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </Labeled>
              {f.collection === "seasonal" ? (
                <Labeled label="Seasonal line">
                  <select
                    value={f.seasonalLine}
                    onChange={(e) => {
                      const line = seasonalLines.find((l) => l.name === e.target.value);
                      setF((s) => ({ ...s, seasonalLine: e.target.value, season: line?.season ?? "" }));
                    }}
                    className={fieldClass}
                  >
                    <option value="">Choose a line</option>
                    {seasonalLines.map((l) => <option key={l.name} value={l.name}>{l.name} ({l.season.toLowerCase()})</option>)}
                  </select>
                </Labeled>
              ) : null}
            </div>
          </Panel>

          <Panel title="Price">
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Base price (USD)"><input type="number" min="0" step="0.01" value={f.basePrice} onChange={set("basePrice")} className={fieldClass} required /></Labeled>
              <Labeled label="Discount %"><input type="number" min="0" max="90" value={f.discountPercent} onChange={set("discountPercent")} className={fieldClass} /></Labeled>
            </div>
          </Panel>
        </div>
      </div>

      {editing ? (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${product.name}?`}
          message="It disappears from the shop, along with its reviews and any bag or wishlist entries. Past orders keep their receipt. This can't be undone."
          confirmLabel="Delete product"
          danger
          onConfirm={remove}
        />
      ) : null}
    </form>
  );
}

function Labeled({ label, hint, className, children }) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="text-xs text-muted-foreground">
        {label}
        {hint ? <span className="ml-1 opacity-70">· {hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

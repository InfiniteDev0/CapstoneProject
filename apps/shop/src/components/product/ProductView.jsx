"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { RecommendedForYou } from "@/components/shop/RecommendedForYou";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { Stars } from "@/components/shop/Stars";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { formatPrice, titleCase, unitPrice } from "@/lib/format";
import { notify } from "@/lib/toast";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { ProductReviews } from "./ProductReviews";
import { SimilarItems } from "./SimilarItems";

const STYLE_LABELS = {
  OPEN_FRONT: "Open front",
  CLOSED_FRONT: "Closed front",
  HALF_CLOSED: "Half closed",
  COMPLETELY_CLOSED: "Completely closed",
};

/** The product page: photos, colours, abaya options, stock, add to bag, wishlist, reviews, similar pieces. */
export default function ProductView({ slug }) {
  const { data: product, loading, error, reload } = useApi(`/api/store/products/${slug}`);

  // VIEW goes into the clickstream once per product (fire-and-forget)
  useEffect(() => {
    if (product?.id) track("VIEW", { productId: product.id, category: product.category, page: `/product/${slug}` });
  }, [product?.id, product?.category, slug]);

  if (loading) return <ProductSkeleton />;
  if (error?.status === 404) {
    return (
      <div className="pt-24">
        <EmptyState title="This piece is no longer available" message="It may have sold out for good or moved." action={{ label: "Browse the collections", href: "/shop" }} />
      </div>
    );
  }
  if (error) return <div className="pt-24"><ErrorState onRetry={reload} /></div>;
  return <ProductDetail product={product} />;
}

function ProductDetail({ product }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const firstChoice = product.variants.find((v) => v.isDefault && v.stock > 0) ?? product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [sku, setSku] = useState(firstChoice.sku);
  const variant = product.variants.find((v) => v.sku === sku) ?? firstChoice;
  const isAbaya = Boolean(product.abaya);

  const [size, setSize] = useState("");
  const [style, setStyle] = useState(product.abaya?.styles?.[0] ?? "");
  const [length, setLength] = useState("");
  const [shayla, setShayla] = useState(product.abaya?.shaylaIncluded ? "STANDARD" : "");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const maxQty = Math.max(1, Math.min(variant.stock, 20));
  useEffect(() => setQty((q) => Math.min(q, maxQty)), [maxQty]);

  // Photos: the chosen colour's own photos first, then the product's
  const images = useMemo(() => [...new Set([...(variant.images ?? []), ...(product.images ?? [])])], [variant, product.images]);
  const [imageIndex, setImageIndex] = useState(0);
  useEffect(() => setImageIndex(0), [sku]);

  // Wishlist heart (only when signed in)
  const wishlist = useApi(isAuthenticated ? "/api/wishlist" : null);
  const hearted = Boolean(wishlist.data?.some((w) => w.productId === product.id));
  const toggleHeart = async () => {
    if (!isAuthenticated) return askToSignIn("save pieces to your wishlist");
    try {
      if (hearted) {
        await api(`/api/wishlist/${product.id}`, { method: "DELETE" });
        wishlist.setData((list) => list.filter((w) => w.productId !== product.id));
        notify.success("Removed from your wishlist");
      } else {
        wishlist.setData(await api("/api/wishlist", { method: "POST", body: { productId: product.id } }));
        notify.success("Saved to your wishlist");
      }
    } catch {
      // toast already shown
    }
  };

  const askToSignIn = (why) => {
    notify.info(`Please sign in to ${why}`);
    router.push(`/login?redirect=/product/${product.slug}`);
  };

  const addToBag = async () => {
    if (!isAuthenticated) return askToSignIn("add pieces to your bag");
    if (isAbaya && !size) return notify.error("Please choose a size");
    setAdding(true);
    try {
      await api("/api/cart/items", {
        method: "POST",
        body: {
          productId: product.id,
          sku: variant.sku,
          quantity: qty,
          selectedSize: isAbaya ? size : undefined,
          selectedStyle: isAbaya && style ? style : undefined,
          shaylaType: isAbaya && shayla ? shayla : undefined,
          comments: isAbaya && length ? `Length: ${length}` : undefined,
        },
      });
      window.dispatchEvent(new Event("vn:cart-changed"));
      notify.success(`${product.name} added to your bag`, { action: { label: "View bag", onClick: () => router.push("/cart") } });
    } catch {
      // toast already shown (e.g. "Only 4 left")
    } finally {
      setAdding(false);
    }
  };

  const price = unitPrice(product, variant);
  const discounted = Number(product.discountPercent) > 0;
  const soldOut = variant.stock <= 0 || product.status !== "LIVE";
  const stockLabel = product.status !== "LIVE" ? "Not available to buy right now" : variant.stock <= 0 ? "Sold out" : variant.stock <= 5 ? `Only ${variant.stock} left` : "In stock";

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-28">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/shop" className="hover:text-black">Shop</Link>
        {product.collection ? (
          <>
            {" / "}
            <Link href={`/shop?collection=${product.collection}`} className="hover:text-black">{titleCase(product.collection)}</Link>
          </>
        ) : null}
        {" / "}
        <span className="text-black">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-zinc-100">
            {images[imageIndex] ? (
              <Image src={images[imageIndex]} alt={`${product.name} in ${variant.colorName}`} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  className={cn("relative aspect-square w-20 overflow-hidden rounded-md bg-zinc-100", i === imageIndex ? "opacity-100 ring-1 ring-black" : "opacity-60")}
                  aria-label={`Photo ${i + 1}`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="space-y-7">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              {[product.seasonalLine, product.collection && titleCase(product.collection), titleCase(product.category)].filter(Boolean).join(" · ")}
            </p>
            <h1 className="text-3xl">{product.name}</h1>
            {product.ratings?.count > 0 ? (
              <a href="#reviews" className="flex items-center gap-2 text-xs text-zinc-500 hover:text-black">
                <Stars value={product.ratings.average} /> {product.ratings.average} · {product.ratings.count} review{product.ratings.count === 1 ? "" : "s"}
              </a>
            ) : null}
            <div className="flex items-baseline gap-3 pt-1 text-xl">
              <span>{formatPrice(price)}</span>
              {discounted ? <span className="text-base text-zinc-400 line-through">{formatPrice(variant.priceOverride ?? product.basePrice)}</span> : null}
              {discounted ? <span className="text-xs uppercase tracking-widest text-zinc-500">{product.discountPercent}% off</span> : null}
            </div>
          </div>

          {product.description ? <p className="text-sm leading-relaxed text-zinc-600">{product.description}</p> : null}

          {/* Colours */}
          <div className="space-y-3">
            <p className="text-sm">
              Colour: <span className="font-medium">{variant.colorName}</span>
              <span className={cn("ml-3 text-xs", variant.stock <= 0 ? "text-red-600" : variant.stock <= 5 ? "text-amber-700" : "text-zinc-500")}>{stockLabel}</span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((v) => (
                <button
                  key={v.sku}
                  type="button"
                  onClick={() => setSku(v.sku)}
                  title={`${v.colorName}${v.stock <= 0 ? " (sold out)" : ""}`}
                  aria-label={v.colorName}
                  aria-pressed={v.sku === sku}
                  className={cn("relative size-8 rounded-full ring-offset-2 transition", v.sku === sku ? "ring-2 ring-black" : "ring-1 ring-black/15 hover:ring-black/40")}
                  style={{ backgroundColor: v.colorHex ?? "#e4e4e7" }}
                >
                  {v.stock <= 0 ? <span className="absolute left-1/2 top-1/2 h-px w-9 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-600" /> : null}
                </button>
              ))}
            </div>
          </div>

          {/* Abaya options */}
          {isAbaya ? (
            <div className="space-y-5">
              <Choice label="Size" required value={size} options={product.abaya.sizes} onChange={setSize} />
              {product.abaya.styles?.length ? (
                <Choice label="Front" value={style} options={product.abaya.styles} labels={STYLE_LABELS} onChange={setStyle} />
              ) : null}
              <div className="flex flex-wrap gap-6">
                {product.abaya.lengths?.length ? (
                  <label className="space-y-1.5 text-sm">
                    <span className="block">Length (inches)</span>
                    <select value={length} onChange={(e) => setLength(e.target.value)} className="h-10 rounded-md bg-zinc-100 px-3 outline-none">
                      <option value="">Standard</option>
                      {product.abaya.lengths.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                ) : null}
                {product.abaya.shaylaIncluded ? (
                  <label className="space-y-1.5 text-sm">
                    <span className="block">Shayla</span>
                    <select value={shayla} onChange={(e) => setShayla(e.target.value)} className="h-10 rounded-md bg-zinc-100 px-3 outline-none">
                      <option value="STANDARD">Matching shayla</option>
                      <option value="CUSTOM">Custom shayla</option>
                      <option value="NONE">No shayla</option>
                    </select>
                  </label>
                ) : null}
              </div>
              {product.abaya.fabric ? <p className="text-xs text-zinc-500">Fabric: {product.abaya.fabric}</p> : null}
            </div>
          ) : null}

          {/* Perfume notes */}
          {product.perfume ? (
            <div className="grid grid-cols-3 gap-3 rounded-md bg-zinc-50 p-4 text-sm">
              {["top", "heart", "base"].map((k) => (
                <div key={k}>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{k} notes</p>
                  <p>{product.perfume.notes?.[k]?.join(", ") || "—"}</p>
                </div>
              ))}
              <p className="col-span-3 text-xs text-zinc-500">{product.perfume.volumeMl} ml</p>
            </div>
          ) : null}

          {/* Quantity + actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center rounded-md bg-zinc-100">
              <button type="button" aria-label="One less" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)} className="px-3 disabled:opacity-30">
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
              <button type="button" aria-label="One more" disabled={qty >= maxQty || soldOut} onClick={() => setQty((q) => q + 1)} className="px-3 disabled:opacity-30">
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={addToBag}
              disabled={soldOut || adding}
              className="h-12 flex-1 rounded-md bg-black px-8 text-sm uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85 disabled:opacity-40"
            >
              {soldOut ? "Sold out" : adding ? "Adding…" : "Add to bag"}
            </button>
            <button
              type="button"
              onClick={toggleHeart}
              aria-label={hearted ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={hearted}
              className="flex size-12 items-center justify-center rounded-md bg-zinc-100 transition-colors hover:bg-zinc-200"
            >
              <Heart className={cn("size-5", hearted && "fill-black")} />
            </button>
          </div>

          {product.story ? (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">The story</p>
              <p className="font-display text-3xl leading-snug">{product.story}</p>
            </div>
          ) : null}

          {product.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((t) => (
                <Link key={t} href={`/shop?tags=${encodeURIComponent(t)}`} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs hover:bg-zinc-200">
                  #{t}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-24 space-y-24">
        <RecommendedForYou />
        <SimilarItems product={product} />
        <ProductReviews product={product} />
      </div>
    </div>
  );
}

/** A row of pill buttons (sizes, front styles). */
function Choice({ label, value, options, labels = {}, onChange, required }) {
  return (
    <div className="space-y-2">
      <p className="text-sm">
        {label}
        {required && !value ? <span className="ml-2 text-xs text-zinc-500">Please choose</span> : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={cn("min-w-11 rounded-md px-3 py-2 text-sm transition-colors", value === o ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200")}
          >
            {labels[o] ?? o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-28 lg:grid-cols-2 lg:gap-16">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="size-8 rounded-full" />)}</div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

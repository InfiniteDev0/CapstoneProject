import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { Stars } from "./Stars";

/** A product in a grid: photo, name, price, colour dots, a small badge. Uses the API's ProductSummary. */
export function ProductCard({ product }) {
  const discounted = Number(product.finalPrice) < Number(product.price);
  const badge = !product.inStock
    ? "Sold out"
    : product.isLimitedEdition
      ? "Limited"
      : product.isNew
        ? "New"
        : product.isBestSeller
          ? "Best seller"
          : null;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-zinc-100">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{product.seasonalLine ?? product.category}</p>
        <h3 className="text-sm leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span>{formatPrice(product.finalPrice)}</span>
          {discounted ? <span className="text-zinc-400 line-through">{formatPrice(product.price)}</span> : null}
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="flex items-center gap-1">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c.sku}
                title={c.name}
                className="size-3 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: c.hex ?? "#e4e4e7", opacity: c.inStock ? 1 : 0.35 }}
              />
            ))}
          </span>
          {product.ratingCount > 0 ? (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Stars value={product.ratingAverage} size="size-3" /> ({product.ratingCount})
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="mt-3 h-3 w-16" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-12" />
    </div>
  );
}

/** A grid of cards, or skeletons while loading. */
export function ProductGrid({ products, loading, count = 8, className = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" }) {
  return (
    <div className={`grid gap-x-4 gap-y-10 ${className}`}>
      {loading
        ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

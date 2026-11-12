"use client";

import Link from "next/link";
import { ProductGrid } from "@/components/shop/ProductCard";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { useApi } from "@/hooks/use-api";

/** The pieces you've hearted (protected by src/proxy.js). */
export default function WishlistPage() {
  const { data, loading, error, reload } = useApi("/api/wishlist");
  const products = (data ?? []).map((w) => w.product).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-28">
      <Link href="/account" className="text-xs text-zinc-500 hover:text-black">← My Vela Noire</Link>
      <h1 className="mt-2 text-3xl">Wishlist</h1>
      <div className="mt-8">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !loading && products.length === 0 ? (
          <EmptyState title="Your wishlist is empty" message="Tap the heart on any piece to keep it here." action={{ label: "Browse the collections", href: "/shop" }} />
        ) : (
          <ProductGrid products={products} loading={loading} count={4} />
        )}
      </div>
    </div>
  );
}

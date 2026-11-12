"use client";

import { X } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/shop/ProductCard";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { notify } from "@/lib/toast";

/** The pieces you've hearted. */
export default function WishlistPage() {
  const { data, loading, error, reload, setData } = useApi("/api/wishlist");
  const items = (data ?? []).filter((w) => w.product);

  const remove = async (w) => {
    try {
      await api(`/api/wishlist/${w.productId}`, { method: "DELETE" });
      setData((list) => list.filter((x) => x.productId !== w.productId));
      notify.success(`${w.product.name} removed from your wishlist`);
    } catch {
      // toast already shown
    }
  };

  if (error) return <ErrorState onRetry={reload} />;
  if (!loading && items.length === 0) {
    return <EmptyState title="Your wishlist is empty" message="Tap the heart on any piece to keep it here." action={{ label: "Browse the collections", href: "/shop" }} />;
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3">
      {loading
        ? Array.from({ length: 3 }, (_, i) => <ProductCardSkeleton key={i} />)
        : items.map((w) => (
            <div key={w.productId} className="relative">
              <ProductCard product={w.product} />
              <button
                type="button"
                onClick={() => remove(w)}
                aria-label={`Remove ${w.product.name} from wishlist`}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 transition-colors hover:bg-white"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
    </div>
  );
}

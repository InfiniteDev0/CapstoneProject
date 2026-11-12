"use client";

import { ProductGrid } from "@/components/shop/ProductCard";
import { SectionHeading } from "@/components/shop/States";
import { useApi } from "@/hooks/use-api";

/**
 * "Similar Items": for now, other pieces from the same collection (or category).
 * Phase 7 swaps this rule for the AI recommender's "similar items".
 */
export function SimilarItems({ product }) {
  const filter = product.collection
    ? `collection=${encodeURIComponent(product.collection)}${product.season ? `&season=${product.season}` : ""}`
    : `category=${encodeURIComponent(product.category)}`;
  const { data, loading, error } = useApi(`/api/store/products?${filter}&sort=popular&size=5`);
  const items = (data?.items ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  if (error || (!loading && items.length === 0)) return null;
  return (
    <section>
      <SectionHeading eyebrow="You may also like" title="Similar Items" />
      <ProductGrid products={items} loading={loading} count={4} />
    </section>
  );
}

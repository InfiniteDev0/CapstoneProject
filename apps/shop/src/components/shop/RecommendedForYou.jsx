"use client";

import { ProductGrid } from "./ProductCard";
import { SectionHeading } from "./States";

/**
 * "Recommended For You": the smart waiter's picks for this shopper.
 * Phase 7 passes the AI's products here (from Java, which asks Python).
 * Until then there are no picks, so the section hides itself completely.
 */
export function RecommendedForYou({ products = [], loading = false }) {
  if (!loading && products.length === 0) return null;
  return (
    <section>
      <SectionHeading eyebrow="Chosen for you" title="Recommended For You" />
      <ProductGrid products={products} loading={loading} count={4} />
    </section>
  );
}

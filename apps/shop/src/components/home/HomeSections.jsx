"use client";

import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "@/components/shop/ProductCard";
import { RecommendedForYou } from "@/components/shop/RecommendedForYou";
import { EmptyState, ErrorState, SectionHeading } from "@/components/shop/States";
import { useApi } from "@/hooks/use-api";

/** Everything under the hero: collections, categories, featured pieces, and the AI slot. */
export default function HomeSections() {
  return (
    <div className="mx-auto max-w-7xl space-y-20 px-5 py-16">
      <Collections />
      <RecommendedForYou />
      <Featured />
      <Categories />
    </div>
  );
}

function Collections() {
  const { data, loading, error, reload } = useApi("/api/store/collections");
  return (
    <section>
      <SectionHeading eyebrow="The houses of Vela Noire" title="Our Collections" />
      {error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] w-full" />)
            : data.map((c) => (
                <Link key={c.slug} href={`/shop?collection=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-zinc-900">
                  {c.heroImage ? (
                    <Image src={c.heroImage} alt={c.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/75" />
                  <div className="absolute inset-x-0 bottom-0 space-y-1 p-5 text-white">
                    <h3 className="text-lg">{c.name}</h3>
                    {c.tagline ? <p className="text-xs text-white/75">{c.tagline}</p> : null}
                  </div>
                </Link>
              ))}
        </div>
      )}
    </section>
  );
}

function Featured() {
  const { data, loading, error, reload } = useApi("/api/store/products?sort=popular&size=8");
  return (
    <section>
      <SectionHeading eyebrow="Most loved" title="Featured Pieces" action={{ label: "View all", href: "/shop" }} />
      {error ? (
        <ErrorState onRetry={reload} />
      ) : !loading && data.items.length === 0 ? (
        <EmptyState title="New pieces are on their way" message="The atelier is preparing the next collection." />
      ) : (
        <ProductGrid products={data?.items ?? []} loading={loading} />
      )}
    </section>
  );
}

function Categories() {
  const { data, loading, error } = useApi("/api/store/categories");
  if (error) return null; // a nice extra, not worth an error box
  return (
    <section>
      <SectionHeading eyebrow="Shop by" title="Category" />
      <div className="flex flex-wrap gap-2">
        {loading
          ? Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)
          : data.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className="rounded-full bg-zinc-100 px-4 py-2 text-sm tracking-wide transition-colors hover:bg-black hover:text-white"
              >
                {c.name}
              </Link>
            ))}
      </div>
    </section>
  );
}

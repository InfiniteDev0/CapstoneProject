"use client";

import Link from "next/link";
import { EmptyState, ErrorState, PageHeader } from "@/components/admin/ui-bits";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { imageUrl } from "@/lib/api";

/** The 4 collections; each opens its products. */
export default function CollectionsPage() {
  const { data, loading, error, reload } = useApi("/api/store/collections");
  return (
    <>
      <PageHeader title="Collections" description="Seasonal, Modern Muse, Traditions Reimagined and Simplicity Speaks." />
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No collections yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.map((c) => (
            <Link key={c.slug} href={`/dashboard/collections/${c.slug}`} className="group overflow-hidden rounded-lg bg-card transition-shadow hover:ring-2 hover:ring-foreground/10">
              <div className="h-36 overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.heroImage ? <img src={imageUrl(c.heroImage)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
              </div>
              <div className="space-y-1 p-3">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.tagline}</p>
                {c.lines?.length ? <p className="text-xs text-muted-foreground">{c.lines.map((l) => l.name).join(" · ")}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

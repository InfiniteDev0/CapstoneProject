"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ErrorState } from "@/components/shop/States";
import { StarPicker, Stars } from "@/components/shop/Stars";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { notify } from "@/lib/toast";

/** Ratings and reviews. Anyone can read; signed-in shoppers can write one review per piece. */
export function ProductReviews({ product }) {
  const [size, setSize] = useState(5);
  const { data, loading, error, reload } = useApi(`/api/store/products/${product.id}/reviews?size=${size}`);
  const { isAuthenticated, user } = useAuth();
  const already = data?.items?.some((r) => r.userName && user && r.userName.startsWith(user.name.split(" ")[0]));

  return (
    <section id="reviews" className="grid gap-10 lg:grid-cols-[18rem_1fr]">
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">What she says</p>
        <h2 className="text-2xl">Reviews</h2>
        {product.ratings?.count > 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{product.ratings.average}</span>
            <div>
              <Stars value={product.ratings.average} size="size-4" />
              <p className="text-xs text-zinc-500">{product.ratings.count} review{product.ratings.count === 1 ? "" : "s"}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No reviews yet. Be the first.</p>
        )}
        {isAuthenticated ? (
          already ? null : <ReviewForm productId={product.id} onPosted={reload} />
        ) : (
          <p className="text-sm text-zinc-600">
            <Link href={`/login?redirect=/product/${product.slug}%23reviews`} className="underline underline-offset-4">Sign in</Link> to write a review.
          </p>
        )}
      </div>

      <div>
        {error ? (
          <ErrorState onRetry={reload} className="py-8" />
        ) : loading && !data ? (
          <div className="space-y-6">{Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : data.items.length === 0 ? null : (
          <ul className="space-y-8">
            {data.items.map((r) => (
              <li key={r.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Stars value={r.rating} />
                  {r.title ? <span className="text-sm font-medium">{r.title}</span> : null}
                </div>
                {r.comment ? <p className="text-sm leading-relaxed text-zinc-600">{r.comment}</p> : null}
                <p className="flex items-center gap-2 text-xs text-zinc-500">
                  {r.userName} · {formatDate(r.createdAt)}
                  {r.verifiedPurchase ? (
                    <span className="flex items-center gap-1 text-zinc-700"><BadgeCheck className="size-3.5" /> Verified purchase</span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
        {data && data.totalItems > data.items.length ? (
          <button type="button" onClick={() => setSize((s) => s + 5)} className="mt-8 text-sm underline underline-offset-4">
            Show more reviews
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ReviewForm({ productId, onPosted }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return notify.error("Please choose a star rating");
    setSending(true);
    try {
      await api(`/api/store/products/${productId}/reviews`, {
        method: "POST",
        body: { rating, title: title || undefined, comment: comment || undefined },
      });
      notify.success("Thank you for your review");
      setRating(0);
      setTitle("");
      setComment("");
      onPosted();
    } catch {
      // toast already shown (e.g. already reviewed)
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 pt-2">
      <StarPicker value={rating} onChange={setRating} />
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Title (optional)" className="h-10 w-full rounded-md bg-zinc-100 px-3 text-sm outline-none" />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={3} placeholder="Tell us about the fit, the fabric, the feeling…" className="w-full resize-none rounded-md bg-zinc-100 p-3 text-sm outline-none" />
      <button type="submit" disabled={sending} className="h-10 rounded-md bg-black px-5 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-50">
        {sending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

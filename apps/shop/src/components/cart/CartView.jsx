"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Minus, Plus, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { lineOptions } from "@/lib/labels";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** The bag: change quantities, remove pieces, see totals and any stock problems before checkout. */
export default function CartView() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { cart, loading, error, refresh, setCart } = useCart();
  const [busy, setBusy] = useState(null); // id of the line being changed

  if (!authLoading && !isAuthenticated) {
    return (
      <Shell>
        <EmptyState title="Sign in to see your bag" message="Your bag is saved to your account, so it follows you to any device." action={{ label: "Sign in", href: "/login?redirect=/cart" }} />
      </Shell>
    );
  }
  if (error && !cart) return <Shell><ErrorState onRetry={refresh} /></Shell>;
  if (loading && !cart) return <Shell><CartSkeleton /></Shell>;
  if (!cart || cart.items.length === 0) {
    return (
      <Shell>
        <EmptyState title="Your bag is empty" message="Discover pieces made for the woman who walks with purpose." action={{ label: "Browse the collections", href: "/shop" }} />
      </Shell>
    );
  }

  const change = async (line, quantity) => {
    setBusy(line.id);
    try {
      setCart(
        quantity === 0
          ? await api(`/api/cart/items/${line.id}`, { method: "DELETE" })
          : await api(`/api/cart/items/${line.id}`, { method: "PATCH", body: { quantity } }),
      );
      if (quantity === 0) notify.success(`${line.name} removed from your bag`);
    } catch {
      // toast already shown (e.g. "Only 3 left")
    } finally {
      setBusy(null);
    }
  };

  const problems = cart.items.filter((l) => !l.available);
  const toFree = Math.max(0, Number(cart.freeShippingFrom) - Number(cart.subtotal));

  return (
    <Shell count={cart.itemCount}>
      <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-8">
          {cart.items.map((line) => (
            <li key={line.id} className={cn("flex gap-5", busy === line.id && "opacity-60")}>
              <Link href={line.slug ? `/product/${line.slug}` : "/shop"} className="relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                {line.image ? <Image src={line.image} alt={line.name} fill sizes="112px" className="object-cover" /> : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <Link href={line.slug ? `/product/${line.slug}` : "/shop"} className="block truncate hover:underline">{line.name}</Link>
                    <p className="text-xs text-zinc-500">{[line.colorName, lineOptions(line)].filter(Boolean).join(" · ")}</p>
                    <p className="text-xs text-zinc-500">{formatPrice(line.unitPrice)} each</p>
                  </div>
                  <p className="shrink-0">{formatPrice(line.lineTotal)}</p>
                </div>

                {!line.available ? (
                  <p className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="size-3.5" />
                    {line.stock === 0 ? "Sold out. Please remove it to continue." : `Only ${line.stock} left. Please lower the quantity.`}
                  </p>
                ) : line.stock <= 5 ? (
                  <p className="text-xs text-amber-700">Only {line.stock} left</p>
                ) : null}

                <div className="flex items-center justify-between">
                  <div className="flex h-9 items-center rounded-md bg-zinc-100">
                    <button type="button" aria-label="One less" disabled={busy === line.id || line.quantity <= 1} onClick={() => change(line, line.quantity - 1)} className="px-2.5 disabled:opacity-30">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums">{line.quantity}</span>
                    <button type="button" aria-label="One more" disabled={busy === line.id || line.quantity >= Math.min(line.stock, 20)} onClick={() => change(line, line.quantity + 1)} className="px-2.5 disabled:opacity-30">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button type="button" onClick={() => change(line, 0)} disabled={busy === line.id} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-black">
                    <X className="size-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-5 rounded-md bg-zinc-50 p-6 lg:sticky lg:top-28">
          <h2 className="text-lg">Summary</h2>
          <dl className="space-y-2 text-sm">
            <Row label={`Subtotal (${cart.itemCount} item${cart.itemCount === 1 ? "" : "s"})`} value={formatPrice(cart.subtotal)} />
            <Row label="Shipping" value={Number(cart.shippingFee) === 0 ? "Free" : formatPrice(cart.shippingFee)} />
            <div className="pt-2">
              <Row label="Total" value={formatPrice(cart.total)} strong />
            </div>
          </dl>
          {toFree > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs text-zinc-500">Add {formatPrice(toFree)} more for free shipping</p>
              <div className="h-1 overflow-hidden rounded-full bg-zinc-200">
                <div className="h-full bg-black" style={{ width: `${Math.min(100, (Number(cart.subtotal) / Number(cart.freeShippingFrom)) * 100)}%` }} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Your order ships free.</p>
          )}
          {problems.length > 0 ? (
            <p className="text-xs text-red-600">Please fix the highlighted {problems.length === 1 ? "piece" : "pieces"} before checkout.</p>
          ) : null}
          <Link
            href="/checkout"
            aria-disabled={problems.length > 0}
            className={cn(
              "flex h-12 items-center justify-center rounded-md bg-black text-sm uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85",
              problems.length > 0 && "pointer-events-none opacity-40",
            )}
          >
            Checkout
          </Link>
          <Link href="/shop" className="block text-center text-xs underline underline-offset-4">Continue shopping</Link>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children, count }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28">
      <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Vela Noire</p>
      <h1 className="mb-10 text-3xl">Your bag{count ? <span className="text-zinc-400"> ({count})</span> : null}</h1>
      {children}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={cn("flex justify-between", strong && "text-base font-medium")}>
      <dt className={strong ? "" : "text-zinc-600"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex gap-5">
            <Skeleton className="aspect-[3/4] w-28" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Info, Lock } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { EmptyState, ErrorState } from "@/components/shop/States";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { PAYMENT_LABELS, lineOptions } from "@/lib/labels";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    shippingName: z.string().trim().min(2, "Please enter the recipient's name").max(120),
    shippingAddress: z.string().trim().min(4, "Please enter a street address").max(255),
    shippingCity: z.string().trim().min(2, "Please enter a city").max(80),
    shippingCountry: z.string().trim().min(2, "Please enter a country").max(60),
    paymentMethod: z.enum(["CARD", "MOBILE_MONEY", "PAYPAL", "CASH_ON_DELIVERY"]),
    cardNumber: z.string().optional(),
    discountCode: z.string().trim().max(32).optional(),
  })
  .refine((v) => v.paymentMethod !== "CARD" || (v.cardNumber ?? "").replace(/\D/g, "").length >= 12, {
    path: ["cardNumber"],
    message: "Enter any 12–19 digit test number, e.g. 4242 4242 4242 4242",
  });

/**
 * Simulated checkout. The shopper fills in where to send it and picks a payment method;
 * Java takes the stock, writes the order, records a fake PAID transaction and empties the bag.
 * Only the card's last 4 digits ever leave the page, and nothing is charged.
 */
export default function CheckoutView() {
  const router = useRouter();
  const { cart, loading, error, refresh, setCart } = useCart();
  const [placing, setPlacing] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      shippingName: "",
      shippingAddress: "",
      shippingCity: "",
      shippingCountry: "",
      paymentMethod: "CARD",
      cardNumber: "",
      discountCode: "",
    },
  });
  const method = form.watch("paymentMethod");

  // Pre-fill from the profile (name, city, country)
  useEffect(() => {
    api("/api/user/me", { silent: true })
      .then((p) => {
        const v = form.getValues();
        form.reset({ ...v, shippingName: v.shippingName || p.name, shippingCity: v.shippingCity || p.city || "", shippingCountry: v.shippingCountry || p.country || "" });
      })
      .catch(() => {});
  }, [form]);

  const placeOrder = async (values) => {
    setPlacing(true);
    try {
      const digits = (values.cardNumber ?? "").replace(/\D/g, "");
      const order = await api("/api/orders/checkout", {
        method: "POST",
        body: {
          shippingName: values.shippingName,
          shippingAddress: values.shippingAddress,
          shippingCity: values.shippingCity,
          shippingCountry: values.shippingCountry,
          paymentMethod: values.paymentMethod,
          cardLast4: values.paymentMethod === "CARD" ? digits.slice(-4) : undefined,
          discountCode: values.discountCode || undefined,
        },
      });
      setCart(null);
      window.dispatchEvent(new Event("vn:cart-changed"));
      notify.success(`Order ${order.orderNumber} placed`);
      router.replace(`/checkout/confirmation/${order.id}`);
    } catch {
      // toast already shown (e.g. a piece just sold out); the bag reloads so its warnings show
      refresh();
    } finally {
      setPlacing(false);
    }
  };

  if (error && !cart) return <Shell><ErrorState onRetry={refresh} /></Shell>;
  if (loading && !cart) return <Shell><Skeleton className="h-96 w-full" /></Shell>;
  if (!cart || cart.items.length === 0) {
    return <Shell><EmptyState title="Your bag is empty" message="Add a piece before checking out." action={{ label: "Browse the collections", href: "/shop" }} /></Shell>;
  }
  const problems = cart.items.some((l) => !l.available);

  return (
    <Shell>
      <form onSubmit={form.handleSubmit(placeOrder)} className="grid gap-12 lg:grid-cols-[1fr_22rem]" noValidate>
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-lg">Delivery</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field form={form} name="shippingName" label="Full name" className="sm:col-span-2" autoComplete="name" />
              <Field form={form} name="shippingAddress" label="Street address" className="sm:col-span-2" autoComplete="street-address" />
              <Field form={form} name="shippingCity" label="City" autoComplete="address-level2" />
              <Field form={form} name="shippingCountry" label="Country" autoComplete="country-name" />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg">Payment</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">
                <Info className="size-3.5" /> Demo payment, no real charge
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-md p-4 text-sm transition-colors",
                    method === value ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200",
                  )}
                >
                  <input type="radio" value={value} {...form.register("paymentMethod")} className="sr-only" />
                  {value === "CARD" ? <CreditCard className="size-4" /> : null}
                  {label}
                </label>
              ))}
            </div>
            {method === "CARD" ? (
              <div className="space-y-2">
                <Field form={form} name="cardNumber" label="Card number (test only)" placeholder="4242 4242 4242 4242" inputMode="numeric" autoComplete="off" />
                <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Lock className="size-3" /> This is a capstone demo: use any test number. Only the last 4 digits are saved, and no money moves.
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">For the demo, this payment is approved instantly. No money moves.</p>
            )}
          </section>

          <section className="space-y-2">
            <Field form={form} name="discountCode" label="Discount code (optional)" placeholder="e.g. a code from Vela Noire" className="max-w-xs" />
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-md bg-zinc-50 p-6 lg:sticky lg:top-28">
          <h2 className="text-lg">Your order</h2>
          <ul className="space-y-4">
            {cart.items.map((l) => (
              <li key={l.id} className="flex gap-3 text-sm">
                <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded bg-zinc-200">
                  {l.image ? <Image src={l.image} alt="" fill sizes="56px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{l.name}</p>
                  <p className="text-xs text-zinc-500">{[l.colorName, lineOptions(l), `Qty ${l.quantity}`].filter(Boolean).join(" · ")}</p>
                  {!l.available ? <p className="text-xs text-red-600">Not enough stock</p> : null}
                </div>
                <p>{formatPrice(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 pt-2 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-600">Subtotal</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-600">Shipping</dt><dd>{Number(cart.shippingFee) === 0 ? "Free" : formatPrice(cart.shippingFee)}</dd></div>
            <div className="flex justify-between pt-2 text-base font-medium"><dt>Total</dt><dd>{formatPrice(cart.total)}</dd></div>
          </dl>
          <p className="text-[11px] text-zinc-500">A discount code is applied by Vela Noire when the order is placed.</p>
          <button
            type="submit"
            disabled={placing || problems}
            className="h-12 w-full rounded-md bg-black text-sm uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            {placing ? "Placing order…" : `Place order · ${formatPrice(cart.total)}`}
          </button>
          {problems ? (
            <p className="text-xs text-red-600">
              Some pieces no longer have enough stock. <Link href="/cart" className="underline">Update your bag</Link>.
            </p>
          ) : null}
        </aside>
      </form>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28">
      <Link href="/cart" className="text-xs text-zinc-500 hover:text-black">← Back to your bag</Link>
      <h1 className="mb-10 mt-2 text-3xl">Checkout</h1>
      {children}
    </div>
  );
}

function Field({ form, name, label, className, ...input }) {
  const error = form.formState.errors[name];
  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span>{label}</span>
      <input
        {...form.register(name)}
        {...input}
        aria-invalid={Boolean(error)}
        className={cn("h-11 w-full rounded-md bg-zinc-100 px-3 outline-none focus:bg-zinc-200/70", error && "ring-1 ring-red-500")}
      />
      {error ? <span className="text-xs text-red-600">{error.message}</span> : null}
    </label>
  );
}

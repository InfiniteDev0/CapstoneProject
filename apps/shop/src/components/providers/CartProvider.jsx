"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";

const CartContext = createContext(null);

/**
 * The shopping bag, shared by the whole shop (navbar badge, bag page, checkout).
 *   const { cart, count, loading, error, refresh, setCart } = useCart();
 *
 * Every cart call to Java answers with the whole priced bag, so pages just hand that
 * answer to setCart() and every component redraws. Other pages can shout
 * window.dispatchEvent(new Event("vn:cart-changed")) to make it reload.
 */
export function CartProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setCart(await api("/api/cart", { silent: true }));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  useEffect(() => {
    const reload = () => refresh();
    window.addEventListener("vn:cart-changed", reload);
    return () => window.removeEventListener("vn:cart-changed", reload);
  }, [refresh]);

  const value = useMemo(
    () => ({ cart, count: cart?.itemCount ?? 0, loading: loading || authLoading, error, refresh, setCart }),
    [cart, loading, authLoading, error, refresh],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

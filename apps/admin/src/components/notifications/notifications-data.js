"use client";

import { useSyncExternalStore } from "react";

/**
 * The admin's notifications, built from live data:
 *   - every PAID order still waiting to be prepared  → "New order VN-…"
 *   - every colour with 5 or fewer pieces left        → "Low stock: …"
 *   - a welcome for the signed-in admin
 * Phase 7 adds "customer at risk" alerts from the churn model.
 *
 * Each: { id, kind, title, details: [{label, value}], action, href, date: "YYYY-MM-DD" }
 */
export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n ?? 0));

export function buildNotifications({ today = todayIso(), person, orders = [], lowStock = [] }) {
  const list = [];
  if (person) {
    list.push({
      id: `welcome-${today}`,
      kind: "welcome",
      title: `Welcome back, ${person}`,
      details: [
        { label: "Orders to prepare", value: String(orders.length) },
        { label: "Colours low on stock", value: String(lowStock.length) },
      ],
      action: "Open dashboard",
      href: "/dashboard",
      date: today,
    });
  }
  for (const o of orders) {
    list.push({
      id: `order-${o.id}`,
      kind: "order",
      title: `New order ${o.orderNumber}`,
      details: [
        { label: "Customer", value: o.customerName ?? "—" },
        { label: "Total", value: money(o.total) },
      ],
      action: "Prepare order",
      href: `/dashboard/orders/${o.id}`,
      date: (o.createdAt ?? "").slice(0, 10) || today,
    });
  }
  for (const r of lowStock.slice(0, 8)) {
    list.push({
      id: `stock-${r.sku}-${r.stock}`,
      kind: "stock",
      title: `${r.stock === 0 ? "Sold out" : "Low stock"}: ${r.productName}`,
      details: [
        { label: "Colour", value: r.colorName },
        { label: "Left", value: `${r.stock} piece${r.stock === 1 ? "" : "s"}` },
      ],
      action: "Restock",
      href: "/dashboard/products/inventory",
      date: today,
    });
  }
  return list;
}

/** "Today", "Yesterday" or "2 Oct". */
export function whenLabel(date, today) {
  if (date === today) return "Today";
  const diff = Math.round((new Date(today) - new Date(date)) / 86_400_000);
  if (diff === 1) return "Yesterday";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// --- Read / cleared, shared by every bell on the page --------------------------
let state = { read: new Set(), cleared: new Set() };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const set = (next) => {
  state = next;
  emit();
};

export const notificationStore = {
  markRead: (ids) => set({ ...state, read: new Set([...state.read, ...ids]) }),
  clear: (ids) => set({ ...state, cleared: new Set([...state.cleared, ...ids]) }),
  restore: (ids) => set({ ...state, cleared: new Set([...state.cleared].filter((id) => !ids.includes(id))) }),
};

export function useNotificationState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}

"use client";

import { useSyncExternalStore } from "react";

/**
 * The admin's notifications. Until the Java API sends real alerts (Phase 7),
 * these are sample alerts built from the seed data: Amira's order, the low
 * Malikat Al-Layl stock, Layla going quiet, Amira's review.
 *
 * Each: { id, kind, title, details: [{label, value}], action, href, date: "YYYY-MM-DD" }
 */
export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function buildNotifications(today = todayIso(), person = "there") {
  return [
    {
      id: "welcome",
      kind: "welcome",
      title: `Welcome back, ${person}`,
      details: [
        { label: "Role", value: "Admin" },
        { label: "Store", value: "Vela Noire" },
      ],
      action: "Open dashboard",
      href: "/dashboard",
      date: today,
    },
    {
      id: "stock-105-emr",
      kind: "stock",
      title: "Low stock: Malikat Al-Layl Abaya",
      details: [
        { label: "Colour", value: "Emerald" },
        { label: "Left", value: "4 pieces" },
      ],
      action: "Restock",
      href: "/dashboard/products/inventory",
      date: today,
    },
    {
      id: "churn-3",
      kind: "churn",
      title: "Layla may stop shopping",
      details: [
        { label: "Customer", value: "Layla Mohamed" },
        { label: "Last visit", value: "15 Aug 2026" },
      ],
      action: "Send an offer",
      href: "/dashboard/churn",
      date: "2026-11-09",
    },
    {
      id: "review-101-2",
      kind: "review",
      title: "New 5★ review",
      details: [
        { label: "Product", value: "Velvet Moon Abaya" },
        { label: "From", value: "Amira H." },
      ],
      action: "Read review",
      href: "/dashboard/products",
      date: "2026-10-12",
    },
    {
      id: "order-1",
      kind: "order",
      title: "New order VN-2026-000001",
      details: [
        { label: "Customer", value: "Amira Hassan" },
        { label: "Total", value: "$200.00" },
      ],
      action: "View order",
      href: "/dashboard/orders",
      date: "2026-10-02",
    },
  ];
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

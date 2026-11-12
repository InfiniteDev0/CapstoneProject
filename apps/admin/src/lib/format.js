/** Formatting and labels shared by the admin pages. */

export function formatPrice(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value ?? 0));
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value ?? 0));
}

export function formatDate(value, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", opts);
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function titleCase(text = "") {
  return String(text)
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export const ORDER_STATUS = {
  PENDING: { label: "Pending", tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  PAID: { label: "Paid", tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  PROCESSING: { label: "Processing", tone: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  SHIPPED: { label: "Shipped", tone: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  DELIVERED: { label: "Delivered", tone: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  CANCELLED: { label: "Cancelled", tone: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  REFUNDED: { label: "Refunded", tone: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

/** Where an order may go next: the same rules Java enforces (AdminOrderService). */
export const NEXT_STATUS = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "SHIPPED", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const PRODUCT_STATUS = {
  IN_PRODUCTION: { label: "In production", tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  READY_TO_LAUNCH: { label: "Ready to launch", tone: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  LIVE: { label: "Live", tone: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  SOLD_OUT: { label: "Sold out", tone: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  DISCONTINUED: { label: "Discontinued", tone: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

export const PAYMENT_LABELS = { CARD: "Card", MOBILE_MONEY: "Mobile money", PAYPAL: "PayPal", CASH_ON_DELIVERY: "Cash on delivery" };
export const STYLE_LABELS = { OPEN_FRONT: "Open front", CLOSED_FRONT: "Closed front", HALF_CLOSED: "Half closed", COMPLETELY_CLOSED: "Completely closed" };
export const SHAYLA_LABELS = { STANDARD: "Matching shayla", CUSTOM: "Custom shayla", NONE: "No shayla" };

/** Photos already in the shop's public folder, offered by the product image picker. */
export const SHOP_IMAGES = [
  "/assets/images/A1.webp",
  "/assets/images/A2.webp",
  "/assets/images/A3.webp",
  "/assets/images/A4.webp",
  "/assets/images/abaya.webp",
  "/assets/images/accessories.webp",
  "/assets/images/fragrance.webp",
  "/assets/images/shayla.webp",
];

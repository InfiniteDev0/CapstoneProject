/** Friendly names for the codes the API uses. */

export const STYLE_LABELS = {
  OPEN_FRONT: "Open front",
  CLOSED_FRONT: "Closed front",
  HALF_CLOSED: "Half closed",
  COMPLETELY_CLOSED: "Completely closed",
};

export const SHAYLA_LABELS = { STANDARD: "Matching shayla", CUSTOM: "Custom shayla", NONE: "No shayla" };

export const PAYMENT_LABELS = {
  CARD: "Card",
  MOBILE_MONEY: "Mobile money",
  PAYPAL: "PayPal",
  CASH_ON_DELIVERY: "Cash on delivery",
};

export const ORDER_STATUS = {
  PENDING: { label: "Pending", tone: "bg-zinc-100 text-zinc-700" },
  PAID: { label: "Paid", tone: "bg-blue-50 text-blue-700" },
  PROCESSING: { label: "Being prepared", tone: "bg-amber-50 text-amber-800" },
  SHIPPED: { label: "On its way", tone: "bg-violet-50 text-violet-700" },
  DELIVERED: { label: "Delivered", tone: "bg-green-50 text-green-700" },
  CANCELLED: { label: "Cancelled", tone: "bg-zinc-100 text-zinc-500" },
  REFUNDED: { label: "Refunded", tone: "bg-red-50 text-red-700" },
};

export const GENDER_LABELS = {
  FEMALE: "Female",
  MALE: "Male",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

/** "Size M · Open front · Matching shayla" for a cart or order line. */
export function lineOptions(line) {
  return [
    line.selectedSize && line.selectedSize !== "ONE_SIZE" ? `Size ${line.selectedSize}` : null,
    STYLE_LABELS[line.selectedStyle],
    SHAYLA_LABELS[line.shaylaType],
  ]
    .filter(Boolean)
    .join(" · ");
}

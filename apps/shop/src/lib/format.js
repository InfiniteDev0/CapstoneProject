/** "$145" for whole amounts, "$37.50" otherwise. */
export function formatPrice(value, currency = "USD") {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Same rule as the Java Pricing class: the colour's own price, else the base price, minus any discount. */
export function unitPrice(product, variant) {
  const base = Number(variant?.priceOverride ?? product?.basePrice ?? 0);
  const discount = Number(product?.discountPercent ?? 0);
  return Math.round(base * (100 - discount)) / 100;
}

/** The season right now (northern hemisphere): picks which seasonal line leads the home page. */
export function currentSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  if (m === 12 || m <= 2) return "WINTER";
  if (m <= 5) return "SPRING";
  if (m <= 8) return "SUMMER";
  return "AUTUMN";
}

export function titleCase(text = "") {
  return text
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatDate(value, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", opts);
}

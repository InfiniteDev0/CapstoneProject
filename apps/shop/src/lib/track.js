import { API_URL } from "@/lib/api";
import { deviceId, getToken, sessionId } from "@/lib/session";

/**
 * Clickstream: tell the kitchen what the shopper looked at or searched for.
 * Fire-and-forget: never awaited, never shows an error, never slows the page.
 *
 *   track("VIEW", { productId, category, page: "/product/velvet-moon-abaya" });
 *   track("SEARCH", { query: "oud" });
 *
 * Only VIEW and SEARCH come from here. Java already logs ADD_TO_CART, REMOVE_FROM_CART,
 * WISHLIST and PURCHASE itself, so the shop must not send those again.
 */
export function track(type, { productId, category, query, page } = {}) {
  if (typeof window === "undefined") return;
  const token = getToken();
  try {
    fetch(`${API_URL}/api/events`, {
      method: "POST",
      keepalive: true, // still sent if the shopper navigates away
      headers: {
        "Content-Type": "application/json",
        "X-Device-Id": deviceId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type,
        sessionId: sessionId(),
        productId: productId ?? null,
        category: category ?? null,
        query: query ?? null,
        page: page ?? window.location.pathname + window.location.search,
      }),
    }).catch(() => {});
  } catch {
    // tracking must never break shopping
  }
}

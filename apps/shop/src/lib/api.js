import { notify } from "@/lib/toast";
import { clearToken, deviceId, getToken, sessionId } from "@/lib/session";

/**
 * The order tablet: the ONE way the shop talks to the Java kitchen.
 *
 *   const products = await api("/api/store/products?category=abaya");
 *   await api("/api/cart/items", { method: "POST", body: { productId, sku, quantity: 1 } });
 *
 * Every call: goes to NEXT_PUBLIC_API_URL, attaches the wristband (JWT) if we have one,
 * sends the device and visit ids, and turns Java's { error, message, status } into a toast.
 * If the kitchen says 401 (no or expired wristband) on a logged-in call, it clears the
 * session and sends you to the login page, then back here afterwards.
 *
 * Options: method, body (an object, sent as JSON), silent (no error toast),
 *          redirectOn401 (default true), signal (to cancel).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(status, message, error) {
    super(message);
    this.status = status;
    this.error = error;
  }
}

export async function api(path, { method = "GET", body, silent = false, redirectOn401 = true, signal } = {}) {
  const token = getToken();
  const headers = { Accept: "application/json", "X-Device-Id": deviceId(), "X-Session-Id": sessionId() };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    const message = "We couldn't reach Vela Noire. Please check your connection and try again.";
    if (!silent) notify.error(message);
    throw new ApiError(0, message, "Network Error");
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (response.ok) return data;

  const message = data?.message || "Something went wrong. Please try again.";
  if (response.status === 401 && token && redirectOn401) {
    clearToken();
    if (typeof window !== "undefined") {
      notify.error("Your session has ended. Please sign in again.");
      window.dispatchEvent(new Event("vn:session-ended"));
      const back = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/login?redirect=${back}`);
    }
  } else if (!silent) {
    notify.error(message);
  }
  throw new ApiError(response.status, message, data?.error);
}

import { notify } from "@/lib/toast";
import { clearToken, deviceId, getToken } from "@/lib/session";

/**
 * The manager's order tablet: the ONE way the admin talks to the Java kitchen.
 *
 *   const stats = await api("/api/admin/dashboard/stats");
 *   await api(`/api/admin/orders/${id}/status`, { method: "PATCH", body: { status: "SHIPPED" } });
 *
 * Attaches the admin wristband, turns Java's { error, message, status } into a toast,
 * and on 401 (expired or missing wristband) clears it and goes back to the login page.
 * Options: method, body, silent (no toast), redirectOn401 (default true), signal.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
export const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(status, message, error) {
    super(message);
    this.status = status;
    this.error = error;
  }
}

export async function api(path, { method = "GET", body, silent = false, redirectOn401 = true, signal } = {}) {
  const token = getToken();
  const headers = { Accept: "application/json", "X-Device-Id": deviceId() };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    const message = "Can't reach the Vela Noire API. Is it running on " + API_URL + "?";
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
      const back = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/login?redirect=${back}`);
    }
  } else if (!silent) {
    notify.error(message);
  }
  throw new ApiError(response.status, message, data?.error);
}

/** A product photo path like "/assets/images/A1.webp" lives in the shop; full URLs pass through. */
export function imageUrl(path) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${SHOP_URL}${path}`;
}

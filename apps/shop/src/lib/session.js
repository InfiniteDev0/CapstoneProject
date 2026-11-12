/**
 * The wristband drawer: where the login token (JWT) lives in the browser.
 *
 * It's kept in a cookie (vn_token) so the server-side guard (src/proxy.js) can see it too
 * and bounce guests away from /account and /checkout before the page even loads.
 *
 * Security note (for the report): an httpOnly cookie would be safer, because page scripts
 * couldn't read it, so an XSS bug couldn't steal it. But Java hands the token straight to
 * the browser as JSON, so JavaScript has to store it itself, which means a normal cookie.
 * The fix would be for the API (or a Next.js route) to set the cookie as httpOnly.
 */

export const TOKEN_COOKIE = "vn_token";

export function getToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/** Save the token for as long as Java says it's valid (expiresIn seconds). */
export function setToken(token, expiresIn = 86400) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${expiresIn}; SameSite=Lax${secure}`;
}

export function clearToken() {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * Read the token's contents (user id, role, expiry) without checking the signature.
 * Fine for showing things on screen; Java checks the signature on every request.
 */
export function decodeToken(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/** A random id this browser keeps forever: the API records it as one device. */
export function deviceId() {
  return stored(localStorageSafe(), "vn_device_id");
}

/** A random id for this visit: ties the visit's clicks together in the clickstream. */
export function sessionId() {
  return stored(sessionStorageSafe(), "vn_session_id");
}

function stored(storage, key) {
  if (!storage) return "anonymous";
  try {
    let id = storage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      storage.setItem(key, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function localStorageSafe() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function sessionStorageSafe() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

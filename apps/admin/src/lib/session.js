/**
 * The manager's wristband drawer: the admin's login token (JWT) in a cookie.
 *
 * It's a different cookie from the shop's (vn_admin_token vs vn_token): cookies on
 * "localhost" are shared between ports 3000 and 3001, and a customer's shop wristband
 * must never open the manager's office.
 *
 * Kept in a normal (not httpOnly) cookie because Java returns the token as JSON and the
 * browser must store it itself; the server-side guard (src/proxy.js) reads it too.
 * Safer option (for the report): have the server set it as an httpOnly cookie.
 */

export const TOKEN_COOKIE = "vn_admin_token";

export function getToken() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setToken(token, expiresIn = 86400) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${expiresIn}; SameSite=Lax${secure}`;
}

export function clearToken() {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Read the token's contents (user id, role, expiry). Display only: Java checks the signature. */
export function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** A stable id for this browser, so the API records the admin's device once. */
export function deviceId() {
  try {
    let id = localStorage.getItem("vn_admin_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("vn_admin_device_id", id);
    }
    return id;
  } catch {
    return "admin-browser";
  }
}

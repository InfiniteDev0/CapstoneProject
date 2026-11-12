import { NextResponse } from "next/server";

/**
 * The doorman at the shop's private rooms (Next.js 16 "proxy", formerly middleware).
 * It runs on the server BEFORE a page loads:
 *   - /account and /checkout need a wristband (the vn_token cookie) that hasn't expired,
 *     otherwise you're sent to /login and brought back afterwards.
 *   - /login and /register send you on if you're already signed in.
 * It only reads the expiry; Java still checks the signature on every API call.
 */
const PRIVATE = ["/account", "/checkout"];

export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("vn_token")?.value;
  const valid = token && !isExpired(token);

  if (PRIVATE.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (valid) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete("vn_token");
    return res;
  }

  // Already signed in: skip the login page
  if (valid) {
    const back = request.nextUrl.searchParams.get("redirect");
    const url = request.nextUrl.clone();
    url.pathname = back && back.startsWith("/") && !back.startsWith("//") ? back.split("?")[0] : "/account";
    url.search = back && back.includes("?") ? back.slice(back.indexOf("?")) : "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/login", "/register"],
};

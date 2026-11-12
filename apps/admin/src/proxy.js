import { NextResponse } from "next/server";

/**
 * The manager's door (Next.js 16 proxy). Before any /dashboard page loads on the server,
 * it checks the vn_admin_token cookie: present, not expired, and role ADMIN.
 * Otherwise: off to /login (and back afterwards). Java still checks the signature on every call.
 */
export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("vn_admin_token")?.value;
  const payload = token ? decode(token) : null;
  const ok = payload && payload.role === "ADMIN" && payload.exp * 1000 > Date.now();

  if (pathname.startsWith("/dashboard")) {
    if (ok) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?redirect=${encodeURIComponent(pathname + search)}`;
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete("vn_admin_token");
    return res;
  }

  // /login while already signed in → straight to the dashboard
  if (ok) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

function decode(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export const config = { matcher: ["/dashboard/:path*", "/login"] };

import { NextResponse, type NextRequest } from "next/server";
import { safeAdminPath, SESSION_COOKIE, SESSION_ENDED_PARAM, verifySessionToken } from "@/lib/auth/session";

/**
 * Optimistic gate for /admin. Every admin page and action also calls
 * requireAdmin(), so this is a fast first check, not the only one.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search, searchParams } = req.nextUrl;

  if (pathname === "/admin/login" && searchParams.has(SESSION_ENDED_PARAM) && req.method === "GET") {
    // requireAdmin() sends a disabled or removed account here. Its token is still
    // signed, so clear it instead of bouncing back into the panel. GET only: the
    // sign-in action posts to this same URL and sets a fresh cookie.
    const res = withNoIndex(NextResponse.next());
    res.cookies.delete({ name: SESSION_COOKIE, path: "/admin" });
    return res;
  }

  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login") {
    if (!authed) return withNoIndex(NextResponse.next());
    const next = safeAdminPath(searchParams.get("next")) ?? "/admin/leads";
    return NextResponse.redirect(new URL(next, req.url));
  }
  if (!authed) {
    // Remember where they were going (e.g. a lead linked from the notification email).
    const login = new URL("/admin/login", req.url);
    const next = safeAdminPath(pathname + search);
    if (next) login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }
  return withNoIndex(NextResponse.next());
}

function withNoIndex(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

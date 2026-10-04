import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/**
 * Optimistic gate for /admin. Every admin page and action also calls
 * requireAdmin(), so this is a fast first check, not the only one.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login") {
    return authed ? NextResponse.redirect(new URL("/admin/leads", req.url)) : withNoIndex(NextResponse.next());
  }
  if (!authed) return NextResponse.redirect(new URL("/admin/login", req.url));
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

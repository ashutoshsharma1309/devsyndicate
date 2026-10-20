/**
 * Admin session token helpers. Edge-safe (used by proxy.ts as well as the
 * server), so no Node-only imports here.
 */
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "ds_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export const sessionConfigured = () => key() !== null;

/** Who a session belongs to. sub is an admin account id, or "owner" for the shared password. */
export type SessionIdentity = { sub: string; name: string; email: string | null };

export const OWNER_SUB = "owner";

/**
 * /admin/login?ended=1 clears the cookie in proxy.ts. Server Components can't
 * delete cookies, and a still-signed token for a disabled account would
 * otherwise bounce between the login page and the panel.
 */
export const SESSION_ENDED_PARAM = "ended";

export async function signSession(identity: SessionIdentity) {
  const k = key();
  if (!k) throw new Error("SESSION_SECRET must be set (32+ characters).");
  return new SignJWT({ role: "admin", name: identity.name, email: identity.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(identity.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setAudience("ds-admin")
    .sign(k);
}

/**
 * The identity in a valid token, or null. Tokens issued before named accounts
 * existed carry no sub and are treated as the owner. This only checks the
 * signature; requireAdmin() also checks that a named account is still active.
 */
export async function readSession(token: string | undefined): Promise<SessionIdentity | null> {
  const k = key();
  if (!k || !token) return null;
  try {
    const { payload } = await jwtVerify(token, k, { algorithms: ["HS256"], audience: "ds-admin" });
    if (payload.role !== "admin") return null;
    if (!payload.sub || payload.sub === OWNER_SUB) return { sub: OWNER_SUB, name: "Owner", email: null };
    return {
      sub: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" ? payload.email : null,
    };
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string | undefined) {
  return (await readSession(token)) !== null;
}

/**
 * Where to send someone after signing in: `next` if it's an internal admin
 * path (so an emailed "Open in admin" link lands on the lead), else null.
 * Rejects other origins, protocol-relative "//", and the login page itself.
 */
export function safeAdminPath(next: unknown): string | null {
  if (typeof next !== "string" || next.length > 512 || !next.startsWith("/admin") || next.startsWith("//")) return null;
  try {
    const base = "http://admin.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return null;
    if (!/^\/admin(\/|$)/.test(url.pathname) || url.pathname.replace(/\/+$/, "") === "/admin/login") return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

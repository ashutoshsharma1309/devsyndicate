import "server-only";
import { timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getLeadStore } from "@/lib/leads/store";
import { verifyPassword } from "./password";
import {
  OWNER_SUB,
  readSession,
  SESSION_COOKIE,
  SESSION_ENDED_PARAM,
  SESSION_TTL_SECONDS,
  sessionConfigured,
  signSession,
  type SessionIdentity,
} from "./session";

export type AdminSession = {
  /** Admin account id, or "owner" for the shared password. */
  id: string;
  name: string;
  email: string | null;
  isOwner: boolean;
};

export const OWNER_LABEL = "Owner (shared password)";

/** How the activity log names someone: "Name <email>", or the owner label. */
export function actorLabel(s: AdminSession): string {
  return s.isOwner ? OWNER_LABEL : `${s.name} <${s.email ?? "unknown"}>`;
}

const ownerSession = (): AdminSession => ({ id: OWNER_SUB, name: "Owner", email: null, isOwner: true });

/** The shared password (ADMIN_PASSWORD_HASH, or the plain fallback) is set. */
export const ownerPasswordConfigured = () => Boolean(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD);

/** Admin login is available only when a secret and a password (or hash) are configured. */
export const adminConfigured = () => sessionConfigured() && ownerPasswordConfigured();

/** Break-glass: lets the shared password in even after named accounts exist. */
export const ownerLoginOverride = () => process.env.ADMIN_ALLOW_OWNER_LOGIN === "true";

/**
 * - "named": active admin accounts exist, so sign-in is email + password.
 * - "owner": bootstrap — no accounts yet, the shared password signs in.
 * - "unconfigured": no session secret, or nothing to sign in with.
 */
export type LoginMode = "named" | "owner" | "unconfigured";

export async function loginMode(): Promise<LoginMode> {
  if (!sessionConfigured()) return "unconfigured";
  const store = await getLeadStore();
  if (store) {
    try {
      if ((await store.countActiveAdmins()) > 0) return "named";
    } catch (err) {
      // Fail closed: an unreachable account store must not reopen the shared password.
      console.error("[auth] Couldn't count admin accounts:", (err as Error).message);
      return "named";
    }
  }
  return ownerPasswordConfigured() ? "owner" : "unconfigured";
}

/** Whether the shared password may sign in under this mode. */
export const ownerLoginAllowed = (mode: LoginMode) =>
  ownerPasswordConfigured() && (mode === "owner" || (mode === "named" && ownerLoginOverride()));

/**
 * The shared password. ADMIN_PASSWORD_HASH (preferred) has the form
 * `scrypt:<salt hex>:<hash hex>` — generate it with `npm run admin:hash`.
 * ADMIN_PASSWORD (plain) is a fallback.
 */
export async function checkPassword(input: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return verifyPassword(input, hash);
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;
  // Compare fixed-length digests so the comparison time doesn't leak length.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(plain).digest();
  return timingSafeEqual(a, b);
}

export async function startSession(s: AdminSession) {
  const identity: SessionIdentity = { sub: s.isOwner ? OWNER_SUB : s.id, name: s.name, email: s.email };
  (await cookies()).set(SESSION_COOKIE, await signSession(identity), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax, not strict: a link from a mail app (cross-site) must arrive signed in.
    // Cross-site POSTs still carry no cookie, and server actions also check Origin.
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
}

/**
 * The signed-in admin as the token states it, without checking the account
 * store. For sign-out only; everything else uses requireAdmin().
 */
export async function sessionFromCookie(): Promise<AdminSession | null> {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  return s.sub === OWNER_SUB ? ownerSession() : { id: s.sub, name: s.name, email: s.email, isOwner: false };
}

/**
 * Authoritative check for every admin page and action (cached per request).
 * Redirects to login if signed out. A named admin's account must still exist
 * and be enabled, so disabling someone takes effect on their next request.
 */
export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) redirect("/admin/login");
  if (s.sub === OWNER_SUB) return ownerSession();

  const store = await getLeadStore();
  const account = store ? await store.getAdmin(s.sub) : null;
  // proxy.ts clears the cookie on this URL; a page render can't.
  if (!account || account.disabled) redirect(`/admin/login?${SESSION_ENDED_PARAM}=1`);
  return { id: account.id, name: account.name, email: account.email, isOwner: false };
});

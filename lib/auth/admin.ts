import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
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
  /** Admin account id, or "owner" for the primary admin. */
  id: string;
  /** The primary admin's username, or a named admin's name. */
  name: string;
  email: string | null;
  /** The primary admin (ADMIN_USERNAME + ADMIN_PASSWORD_HASH). */
  isOwner: boolean;
};

export const OWNER_LABEL = "Primary admin";

/** The primary admin's username. Signs in with ADMIN_PASSWORD_HASH. */
const ownerUsername = () => (process.env.ADMIN_USERNAME ?? "").trim();

/** How the activity log names someone: "Name <email>", or "<username> (primary admin)". */
export function actorLabel(s: AdminSession): string {
  return s.isOwner ? `${s.name} (primary admin)` : `${s.name} <${s.email ?? "unknown"}>`;
}

const ownerSession = (): AdminSession => ({
  id: OWNER_SUB,
  name: ownerUsername() || OWNER_LABEL,
  email: null,
  isOwner: true,
});

/** The primary admin is fully configured: a username plus a password hash (or the plain fallback). */
export const ownerPasswordConfigured = () =>
  Boolean(ownerUsername() && (process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD));

/** The primary admin can sign in: a session secret, a username and a password (or hash) are set. */
export const adminConfigured = () => sessionConfigured() && ownerPasswordConfigured();

/**
 * @deprecated ADMIN_ALLOW_OWNER_LOGIN is no longer read: the primary admin can always sign in
 * once configured. Kept so older callers compile; true whenever the primary admin is configured.
 */
export const ownerLoginOverride = () => ownerPasswordConfigured();

/**
 * - "named": active named accounts exist (they sign in with email + password, alongside the primary admin).
 * - "owner": no named accounts; only the primary admin can sign in.
 * - "unconfigured": no session secret, or nobody who could sign in.
 */
export type LoginMode = "named" | "owner" | "unconfigured";

export async function loginMode(): Promise<LoginMode> {
  if (!sessionConfigured()) return "unconfigured";
  const store = await getLeadStore();
  if (store) {
    try {
      if ((await store.countActiveAdmins()) > 0) return "named";
    } catch (err) {
      // Named sign-in still looks the account up (and fails safely) if the store is down.
      console.error("[auth] Couldn't count admin accounts:", (err as { code?: string })?.code ?? "unknown error");
      return "named";
    }
  }
  return ownerPasswordConfigured() ? "owner" : "unconfigured";
}

/**
 * Whether the primary admin may sign in. Always, once configured: it's the main account, and
 * named accounts are additional people, not a replacement.
 */
export const ownerLoginAllowed = (mode: LoginMode) => mode !== "unconfigured" && ownerPasswordConfigured();

/**
 * The primary admin's password. ADMIN_PASSWORD_HASH (preferred) has the form
 * `scrypt:<salt hex>:<hash hex>` — generate it with `npm run admin:hash`.
 * ADMIN_PASSWORD (plain) is a fallback.
 */
export async function checkPassword(input: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return verifyPassword(input, hash);
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;
  return sameText(input, plain);
}

/** Digest compare, so neither the length nor the content leaks through timing. */
const sameText = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

/**
 * The primary admin's credentials. Both checks always run, so a wrong username takes as long as a
 * wrong password, and the caller can't tell which one failed. The username is case-insensitive.
 */
export async function checkOwnerCredentials(username: string, password: string): Promise<AdminSession | null> {
  const expected = ownerUsername();
  const userOk = expected !== "" && sameText(username.trim().toLowerCase(), expected.toLowerCase());
  const passwordOk = await checkPassword(password);
  return userOk && passwordOk && ownerPasswordConfigured() ? ownerSession() : null;
}

/**
 * Re-confirms the signed-in admin's password, for sensitive changes (e.g. where lead emails go):
 * the primary admin against ADMIN_PASSWORD_HASH, a named admin against their own account.
 */
export async function verifyCurrentPassword(session: AdminSession, password: string): Promise<boolean> {
  // The same bound as password changes, so hashing can't be used to tie up the server.
  if (!password || password.length > 200) return false;
  if (session.isOwner) return ownerPasswordConfigured() && (await checkPassword(password));
  const store = await getLeadStore();
  const account = store ? await store.getAdmin(session.id) : null;
  if (!account || account.disabled) return false;
  return verifyPassword(password, account.passwordHash);
}

/**
 * Keyed, truncated fingerprint of the password a session was started with. Stored in the token
 * (claim `pv`), so changing or resetting a password ends that account's other sessions, and
 * rotating ADMIN_USERNAME or ADMIN_PASSWORD_HASH ends the primary admin's. Keyed with
 * SESSION_SECRET so the token reveals nothing about the password or its hash.
 */
function fingerprint(material: string) {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(material)
    .digest("base64url")
    .slice(0, 22);
}

const ownerFingerprint = () =>
  fingerprint(
    `owner\0${ownerUsername().toLowerCase()}\0${process.env.ADMIN_PASSWORD_HASH || `plain:${process.env.ADMIN_PASSWORD ?? ""}`}`,
  );

const accountFingerprint = (passwordHash: string) => fingerprint(`admin\0${passwordHash}`);

/**
 * Signs the admin in. A named admin's `passwordHash` (the stored hash, as just verified or just
 * set) is required, so the session ends when that password changes.
 */
export async function startSession(s: AdminSession, passwordHash?: string) {
  if (!s.isOwner && !passwordHash) throw new Error("startSession: a named admin's session needs their password hash.");
  const identity: SessionIdentity = {
    sub: s.isOwner ? OWNER_SUB : s.id,
    name: s.name,
    email: s.email,
    pv: s.isOwner ? ownerFingerprint() : accountFingerprint(passwordHash!),
  };
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
 * Authoritative check for every admin page, action and route handler (cached per request).
 * Redirects to login if signed out. The session ends (on its next request) when:
 * - the primary admin's username or password changes on the server, or it's no longer configured;
 * - a named admin's account is removed or disabled, or its password is changed or reset.
 */
/**
 * Whether a session token still stands: signed and unexpired (readSession), and — like requireAdmin —
 * its password fingerprint is current and a named account still exists and is enabled.
 */
async function sessionStillValid(token: string | undefined): Promise<boolean> {
  const s = await readSession(token);
  if (!s) return false;
  if (s.sub === OWNER_SUB) return ownerPasswordConfigured() && s.pv === ownerFingerprint();
  const store = await getLeadStore();
  const account = store ? await store.getAdmin(s.sub).catch(() => null) : null;
  return Boolean(account && !account.disabled && s.pv === accountFingerprint(account.passwordHash));
}

/**
 * Draft previews on public pages. The admin cookie is scoped to /admin, so public pages can't see it;
 * starting a preview copies the session token into this site-wide cookie, and a page only renders
 * drafts while that copy is still a valid admin session (see previewSessionValid). Exiting the preview
 * or signing out deletes it, and it expires with the session.
 */
export const PREVIEW_COOKIE = "ds_preview";

export async function startPreviewSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return;
  jar.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endPreviewSession() {
  (await cookies()).delete({ name: PREVIEW_COOKIE, path: "/" });
}

/** True only while the preview cookie holds a still-valid admin session. Never redirects. */
export const previewSessionValid = cache(async (): Promise<boolean> => {
  try {
    return await sessionStillValid((await cookies()).get(PREVIEW_COOKIE)?.value);
  } catch {
    return false;
  }
});

export const requireAdmin = cache(async (): Promise<AdminSession> => {
  const s = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) redirect("/admin/login");
  // proxy.ts clears the cookie on this URL; a page render can't.
  const ended = `/admin/login?${SESSION_ENDED_PARAM}=1`;

  if (s.sub === OWNER_SUB) {
    if (!ownerPasswordConfigured() || s.pv !== ownerFingerprint()) redirect(ended);
    return ownerSession();
  }

  const store = await getLeadStore();
  const account = store ? await store.getAdmin(s.sub) : null;
  if (!account || account.disabled || s.pv !== accountFingerprint(account.passwordHash)) redirect(ended);
  return { id: account.id, name: account.name, email: account.email, isOwner: false };
});

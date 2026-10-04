import "server-only";
import { scrypt as scryptCb, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, sessionConfigured, signSession, verifySessionToken } from "./session";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/** Admin login is available only when a secret and a password (or hash) are configured. */
export const adminConfigured = () =>
  sessionConfigured() && Boolean(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD);

/**
 * ADMIN_PASSWORD_HASH (preferred) has the form `scrypt:<salt hex>:<hash hex>` —
 * generate it with `npm run admin:hash`. ADMIN_PASSWORD (plain) is a fallback.
 */
export async function checkPassword(input: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    const [scheme, saltHex, keyHex] = hash.split(":");
    if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
    const expected = Buffer.from(keyHex, "hex");
    const actual = await scrypt(input, Buffer.from(saltHex, "hex"), expected.length);
    return timingSafeEqual(actual, expected);
  }
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;
  // Compare fixed-length digests so the comparison time doesn't leak length.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(plain).digest();
  return timingSafeEqual(a, b);
}

export async function startSession() {
  (await cookies()).set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
}

/** Authoritative check for every admin page and action. Redirects to login if needed. */
export const requireAdmin = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) redirect("/admin/login");
});

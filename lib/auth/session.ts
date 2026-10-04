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

export async function signSession() {
  const k = key();
  if (!k) throw new Error("SESSION_SECRET must be set (32+ characters).");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setAudience("ds-admin")
    .sign(k);
}

export async function verifySessionToken(token: string | undefined) {
  const k = key();
  if (!k || !token) return false;
  try {
    const { payload } = await jwtVerify(token, k, { algorithms: ["HS256"], audience: "ds-admin" });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

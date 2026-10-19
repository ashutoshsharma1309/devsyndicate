import "server-only";
import { createHash } from "node:crypto";

/**
 * Fixed-window in-memory limiter. Per server instance, so it is a first line
 * of defence; the lead route also checks recent submissions in the database.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
}

export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

/** Salted, truncated hash so raw IP addresses are never stored. */
export function hashIp(ip: string) {
  // `||`, not `??`: .env.example ships IP_HASH_SALT empty, and an empty salt must fall through.
  const salt = process.env.IP_HASH_SALT || process.env.SESSION_SECRET || "dev-syndicate";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

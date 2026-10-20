import "server-only";
import { randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const MIN_PASSWORD_LENGTH = 12;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * `scrypt:<salt hex>:<key hex>` with Node's default scrypt cost — the same as
 * scripts/admin-hash.mjs, so existing ADMIN_PASSWORD_HASH values keep verifying.
 */
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(pw, salt, KEY_BYTES);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

/** Timing-safe. A malformed stored value never matches. */
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex, extra] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex || extra !== undefined) return false;
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length === 0) return false;
  const actual = await scrypt(pw, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// URL-safe and easy to read aloud or retype: no 0/O/o, 1/l/I.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A random 20-character password (~116 bits) for new accounts and resets. */
export function generatePassword(length = 20): string {
  let out = "";
  for (let i = 0; i < Math.max(length, 16); i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

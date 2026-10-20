// Generates an ADMIN_PASSWORD_HASH value.
// Usage: npm run admin:hash -- "your long admin password"
// Same format and parameters as hashPassword() in lib/auth/password.ts (16-byte salt, 64-byte key,
// default scrypt cost), so a hash made here verifies there and vice versa. Change both together.
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Pass a password of at least 12 characters: npm run admin:hash -- "your password"');
  process.exit(1);
}
const salt = randomBytes(16);
const key = scryptSync(password, salt, 64);
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${key.toString("hex")}`);

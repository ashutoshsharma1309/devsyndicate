// Applies db/schema.sql to DATABASE_URL. Safe to run more than once.
// Usage: npm run db:setup
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (add it to .env.local).");
  process.exit(1);
}

const sql = postgres(url, {
  ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
  max: 1,
  // Re-runs report "already exists, skipping" for every object; that's expected, not worth printing.
  onnotice: () => {},
});
try {
  await sql.unsafe(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
  console.log("✓ Lead, admin and activity tables are ready.");
} catch (err) {
  console.error("✗ Failed to apply schema:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}

import "server-only";
import type { LeadStore } from "./types";

/**
 * Picks the lead store for this environment:
 * - DATABASE_URL set  → Postgres (production)
 * - development       → local JSON file in .data/ (gitignored)
 * - otherwise         → null: leads are not stored, only emailed.
 */
export async function getLeadStore(): Promise<LeadStore | null> {
  if (process.env.DATABASE_URL) return (await import("./postgres-store")).postgresStore;
  if (process.env.NODE_ENV !== "production") return (await import("./file-store")).fileStore;
  return null;
}

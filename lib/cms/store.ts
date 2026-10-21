import "server-only";
import type { ContentStore } from "./types";

/**
 * Picks the content store, the same way lib/leads/store.ts picks the lead store:
 * - DATABASE_URL set  → Postgres (production)
 * - development       → .data/content.json
 * - otherwise         → null: the site renders its defaults and nothing can be published.
 */
export async function getContentStore(): Promise<ContentStore | null> {
  if (process.env.DATABASE_URL) return (await import("./postgres-store")).postgresContentStore;
  if (process.env.NODE_ENV !== "production") return (await import("./file-store")).fileContentStore;
  return null;
}

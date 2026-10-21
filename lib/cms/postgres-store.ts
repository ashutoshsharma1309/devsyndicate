import "server-only";
import postgres from "postgres";
import type { SectionKey } from "./schema";
import { MAX_REVISIONS, UUID, type ContentRow, type ContentStore, type RevisionMeta } from "./types";

/**
 * Content in Postgres: `site_content` (one row per section: draft + published)
 * and `site_content_revisions` (the last MAX_REVISIONS publishes per section).
 * Tables are created by `npm run db:setup` (db/schema.sql).
 */

type Row = {
  section: SectionKey;
  draft: unknown | null;
  published: unknown | null;
  draft_saved_at: Date | null;
  draft_saved_by: string | null;
  published_at: Date | null;
  published_by: string | null;
};

type RevisionRow = { id: string; section: SectionKey; published_at: Date; published_by: string | null };

// A pool of its own (separate global key from lib/leads), surviving dev hot reloads.
const g = globalThis as unknown as { __dsCmsSql?: postgres.Sql };

function db() {
  if (!g.__dsCmsSql) {
    g.__dsCmsSql = postgres(process.env.DATABASE_URL!, {
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      // Required by most managed Postgres providers; disable with DATABASE_SSL=disable for local databases.
      ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
      prepare: false,
    });
  }
  return g.__dsCmsSql;
}

const iso = (d: Date | null) => d?.toISOString() ?? null;

const toRow = (r: Row): ContentRow => ({
  section: r.section,
  draft: r.draft ?? null,
  published: r.published ?? null,
  draftSavedAt: iso(r.draft_saved_at),
  draftSavedBy: r.draft_saved_by,
  publishedAt: iso(r.published_at),
  publishedBy: r.published_by,
});

const toMeta = (r: RevisionRow): RevisionMeta => ({
  id: r.id,
  section: r.section,
  publishedAt: r.published_at.toISOString(),
  publishedBy: r.published_by ?? "Unknown",
});

const json = (sql: postgres.Sql | postgres.TransactionSql, v: unknown) => sql.json(v as postgres.JSONValue);

export const postgresContentStore: ContentStore = {
  kind: "postgres",

  async getRow(section) {
    const sql = db();
    const [row] = await sql<Row[]>`
      select section, draft, published, draft_saved_at, draft_saved_by, published_at, published_by
      from site_content where section = ${section}`;
    return row ? toRow(row) : null;
  },

  async listRows() {
    const sql = db();
    const rows = await sql<Row[]>`
      select section, draft, published, draft_saved_at, draft_saved_by, published_at, published_by
      from site_content`;
    return rows.map(toRow);
  },

  async saveDraft(section, draft, by) {
    const sql = db();
    const [row] = await sql<{ draft_saved_at: Date }[]>`
      insert into site_content (section, draft, draft_saved_at, draft_saved_by)
      values (${section}, ${json(sql, draft)}, now(), ${by})
      on conflict (section) do update
        set draft = excluded.draft, draft_saved_at = excluded.draft_saved_at, draft_saved_by = excluded.draft_saved_by
      returning draft_saved_at`;
    return row.draft_saved_at.toISOString();
  },

  async publish(section, content, by) {
    const sql = db();
    const at = await sql.begin(async (tx) => {
      const [row] = await tx<{ published_at: Date }[]>`
        insert into site_content (section, published, published_at, published_by)
        values (${section}, ${json(tx, content)}, now(), ${by})
        on conflict (section) do update
          set published = excluded.published, published_at = excluded.published_at,
              published_by = excluded.published_by,
              draft = null, draft_saved_at = null, draft_saved_by = null
        returning published_at`;
      await tx`
        insert into site_content_revisions (section, content, published_at, published_by)
        values (${section}, ${json(tx, content)}, ${row.published_at}, ${by})`;
      await tx`
        delete from site_content_revisions
        where section = ${section}
          and id not in (
            select id from site_content_revisions where section = ${section}
            order by published_at desc, id desc limit ${MAX_REVISIONS}
          )`;
      return row.published_at;
    });
    return at.toISOString();
  },

  async discardDraft(section) {
    const sql = db();
    await sql`
      update site_content set draft = null, draft_saved_at = null, draft_saved_by = null
      where section = ${section}`;
  },

  async listRevisions(section) {
    const sql = db();
    const rows = await sql<RevisionRow[]>`
      select id, section, published_at, published_by from site_content_revisions
      where section = ${section}
      order by published_at desc, id desc
      limit ${MAX_REVISIONS}`;
    return rows.map(toMeta);
  },

  async getRevision(id) {
    if (!UUID.test(id)) return null;
    const sql = db();
    const [row] = await sql<(RevisionRow & { content: unknown })[]>`
      select id, section, content, published_at, published_by from site_content_revisions where id = ${id}`;
    return row ? { ...toMeta(row), content: row.content } : null;
  },
};

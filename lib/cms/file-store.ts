import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { isSectionKey, type SectionKey } from "./schema";
import { MAX_REVISIONS, UUID, type ContentRow, type ContentStore, type Revision } from "./types";

/**
 * Development content store: a JSON file in .data/ (gitignored), next to the
 * lead file store but separate from it. Not used in production (serverless file
 * systems are ephemeral) — see lib/cms/store.ts.
 */

type Db = { sections: Partial<Record<SectionKey, ContentRow>>; revisions: Revision[] };

const file = path.join(process.cwd(), ".data", "content.json");

async function load(): Promise<Db> {
  let raw: Partial<Db> = {};
  try {
    raw = JSON.parse(await readFile(file, "utf8")) as Partial<Db>;
  } catch {
    // No file yet (or unreadable): start empty.
  }
  const sections: Db["sections"] = {};
  for (const [key, row] of Object.entries(raw.sections ?? {})) if (isSectionKey(key) && row) sections[key] = row;
  return { sections, revisions: Array.isArray(raw.revisions) ? raw.revisions : [] };
}

// Serialise writes so concurrent requests can't clobber each other. On globalThis so every
// route bundle in the dev server shares one queue.
const g = globalThis as unknown as { __dsCmsFileQueue?: Promise<unknown> };

function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = (g.__dsCmsFileQueue ?? Promise.resolve()).then(async () => {
    const db = await load();
    const result = fn(db);
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(db, null, 2));
    await rename(tmp, file);
    return result;
  });
  g.__dsCmsFileQueue = run.catch(() => undefined);
  return run;
}

const emptyRow = (section: SectionKey): ContentRow => ({
  section,
  draft: null,
  published: null,
  draftSavedAt: null,
  draftSavedBy: null,
  publishedAt: null,
  publishedBy: null,
});

export const fileContentStore: ContentStore = {
  kind: "file",

  async getRow(section) {
    return (await load()).sections[section] ?? null;
  },

  async listRows() {
    return Object.values((await load()).sections).filter((r): r is ContentRow => Boolean(r));
  },

  saveDraft(section, draft, by) {
    return mutate((db) => {
      const row = (db.sections[section] ??= emptyRow(section));
      const now = new Date().toISOString();
      row.draft = draft;
      row.draftSavedAt = now;
      row.draftSavedBy = by;
      return now;
    });
  },

  publish(section, content, by) {
    return mutate((db) => {
      const row = (db.sections[section] ??= emptyRow(section));
      const now = new Date().toISOString();
      row.published = content;
      row.publishedAt = now;
      row.publishedBy = by;
      row.draft = null;
      row.draftSavedAt = null;
      row.draftSavedBy = null;
      db.revisions.unshift({ id: randomUUID(), section, content, publishedAt: now, publishedBy: by });
      // Keep the newest MAX_REVISIONS for this section.
      let kept = 0;
      db.revisions = db.revisions.filter((r) => r.section !== section || ++kept <= MAX_REVISIONS);
      return now;
    });
  },

  async discardDraft(section) {
    await mutate((db) => {
      const row = db.sections[section];
      if (!row) return;
      row.draft = null;
      row.draftSavedAt = null;
      row.draftSavedBy = null;
    });
  },

  async listRevisions(section) {
    return (await load()).revisions
      .filter((r) => r.section === section)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, MAX_REVISIONS)
      .map(({ id, section: s, publishedAt, publishedBy }) => ({ id, section: s, publishedAt, publishedBy }));
  },

  async getRevision(id) {
    if (!UUID.test(id)) return null;
    return (await load()).revisions.find((r) => r.id === id) ?? null;
  },
};

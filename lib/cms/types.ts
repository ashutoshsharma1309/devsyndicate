import type { SectionKey } from "./schema";

/** One section's stored state. `draft` and `published` are raw stored JSON (resolved before use). */
export type ContentRow = {
  section: SectionKey;
  draft: unknown | null;
  published: unknown | null;
  draftSavedAt: string | null;
  draftSavedBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
};

export type RevisionMeta = {
  id: string;
  section: SectionKey;
  publishedAt: string;
  publishedBy: string;
};

export type Revision = RevisionMeta & { content: unknown };

/** Revisions kept per section; older ones are pruned on publish. */
export const MAX_REVISIONS = 20;

export interface ContentStore {
  readonly kind: "postgres" | "file";
  getRow(section: SectionKey): Promise<ContentRow | null>;
  listRows(): Promise<ContentRow[]>;
  /** Replaces the draft. Returns the saved-at timestamp (ISO). */
  saveDraft(section: SectionKey, draft: unknown, by: string): Promise<string>;
  /** Sets the published content, clears the draft, records a revision and prunes old ones. Returns published-at (ISO). */
  publish(section: SectionKey, content: unknown, by: string): Promise<string>;
  discardDraft(section: SectionKey): Promise<void>;
  /** Newest first, at most MAX_REVISIONS. */
  listRevisions(section: SectionKey): Promise<RevisionMeta[]>;
  getRevision(id: string): Promise<Revision | null>;
}

/** The store couldn't be read (unreachable, or the tables don't exist yet). */
export class ContentStoreError extends Error {
  readonly code: string | undefined;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "ContentStoreError";
    this.code = code;
  }
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

import type { SectionContent, SectionKey } from "@/lib/cms/schema";

/** What a section editor starts from (serialisable: built on the server by load.ts). */
export type EditorInitial<K extends SectionKey = SectionKey> = {
  key: K;
  label: string;
  /** draft ?? published ?? defaults: what the editor opens. */
  current: SectionContent<K>;
  /** What the site shows now: published ?? defaults. */
  live: SectionContent<K>;
  defaults: SectionContent<K>;
  hasDraft: boolean;
  hasPublished: boolean;
  draftSavedAt: string | null;
  draftSavedBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  hasUnpublishedChanges: boolean;
  storeKind: "postgres" | "file" | null;
  publicPaths: string[];
  siteWide: boolean;
};

export type RevisionItem = { id: string; publishedAt: string; publishedBy: string };

export type EditorData<K extends SectionKey = SectionKey> = {
  initial: EditorInitial<K>;
  revisions: RevisionItem[];
  /** Set when the version history couldn't be read (the editor still works). */
  revisionsError?: string;
};

/**
 * Extra checks shown in the publish dialog.
 * - "error" blocks publishing.
 * - "warning" must be acknowledged with a checkbox.
 * - "password" asks for the admin's current password (sent as currentPassword).
 */
export type PublishCheck =
  | { kind: "error"; message: string }
  | { kind: "warning"; message: string }
  | { kind: "password"; message: string };

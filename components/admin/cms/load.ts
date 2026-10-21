import "server-only";
import { unstable_rethrow } from "next/navigation";
import { getSectionState, listRevisions, type SectionKey } from "@/lib/cms";
import type { EditorData } from "./types";

export type LoadResult<K extends SectionKey> = ({ ok: true } & EditorData<K>) | { ok: false; error: string };

const STORE_HINT = "Couldn't read this section's content. If the database is new, run `npm run db:setup`, then reload.";

/**
 * Everything a section editor page needs, as plain data for the client editor.
 * getSectionState() re-checks the admin session; a store failure becomes a
 * message for the page instead of an error boundary.
 */
export async function loadEditor<K extends SectionKey>(key: K): Promise<LoadResult<K>> {
  let state;
  try {
    state = await getSectionState(key);
  } catch (err) {
    // requireAdmin() redirects by throwing; let that (and other Next control flow) through.
    unstable_rethrow(err);
    return { ok: false, error: (err as Error | null)?.name === "ContentStoreError" ? (err as Error).message || STORE_HINT : STORE_HINT };
  }

  let revisions: EditorData<K>["revisions"] = [];
  let revisionsError: string | undefined;
  try {
    revisions = (await listRevisions(key)).map((r) => ({ id: r.id, publishedAt: r.publishedAt, publishedBy: r.publishedBy }));
  } catch {
    revisionsError = "Couldn't load the version history.";
  }

  return {
    ok: true,
    initial: {
      key,
      label: state.info.label,
      current: state.current,
      live: state.published ?? state.defaults,
      defaults: state.defaults,
      hasDraft: state.draft !== null,
      hasPublished: state.published !== null,
      draftSavedAt: state.draftSavedAt,
      draftSavedBy: state.draftSavedBy,
      publishedAt: state.publishedAt,
      publishedBy: state.publishedBy,
      hasUnpublishedChanges: state.hasUnpublishedChanges,
      storeKind: state.storeKind,
      publicPaths: [...state.info.publicPaths],
      siteWide: state.info.siteWide,
    },
    revisions,
    ...(revisionsError ? { revisionsError } : {}),
  };
}

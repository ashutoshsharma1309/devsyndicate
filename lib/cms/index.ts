import "server-only";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { previewSessionValid, requireAdmin } from "@/lib/auth/admin";
import { site } from "@/lib/site";
import { eventTypes } from "@/lib/validation/lead";
import { defaultsFor } from "./defaults";
import { sameContent } from "./merge";
import { isSectionKey, SECTION_KEYS, type SectionContent, type SectionKey, type SeoPath } from "./schema";
import { ABSOLUTE_TITLE_PATHS, resolveSection, SECTIONS, type SectionInfo } from "./sections";
import { getContentStore } from "./store";
import { ContentStoreError, type ContentRow, type RevisionMeta } from "./types";

/**
 * Site content API (server only).
 *
 * Public pages call getContent() or the typed helpers below. Published content
 * is cached with Next's data cache under the tags "cms" and "cms:<key>", which
 * publishing invalidates. With Draft Mode on (an admin preview, enabled by
 * /admin/content/preview) the draft is read straight from the store on every
 * request and never cached. Any failure falls back to the defaults, which are
 * the site's original copy, so a content problem never takes a page down.
 */

export * from "./schema";
export { DEFAULTS, defaultsFor } from "./defaults";
export { SECTIONS, PAGE_LABELS, ABSOLUTE_TITLE_PATHS, PREVIEW_PATHS, isPreviewPath, resolveSection } from "./sections";
export type { SectionInfo } from "./sections";
export type { ContentRow, Revision, RevisionMeta } from "./types";

export const CMS_TAG = "cms";
export const cmsTag = (key: SectionKey) => `cms:${key}`;

const errorCode = (err: unknown) => (err as { code?: string } | null)?.code;

const isStoreError = (err: unknown): err is ContentStoreError =>
  err instanceof ContentStoreError || (err as Error | null)?.name === "ContentStoreError";

/** Reads one row. Store failures become ContentStoreError (never cached by unstable_cache). */
async function readRow(key: SectionKey): Promise<ContentRow | null> {
  const store = await getContentStore();
  if (!store) return null;
  try {
    return await store.getRow(key);
  } catch (err) {
    throw new ContentStoreError(`Couldn't read content "${key}"`, errorCode(err));
  }
}

/**
 * Whether this request is an admin preview: Draft Mode is on AND the browser still holds a valid admin
 * session (a leftover Draft Mode cookie after the session ended shows published content). cookies() is
 * only read when Draft Mode is on, so normal visitors' pages stay statically generated. Outside a
 * request (scripts, tests) it's never on.
 */
export async function previewEnabled(): Promise<boolean> {
  try {
    if (!(await draftMode()).isEnabled) return false;
    return await previewSessionValid();
  } catch {
    return false;
  }
}

// One cached reader per section, created on first use so the cache key and tags stay stable.
const cachedReaders = new Map<SectionKey, () => Promise<unknown>>();

function cachedPublished(key: SectionKey) {
  let reader = cachedReaders.get(key);
  if (!reader) {
    reader = unstable_cache(async () => (await readRow(key))?.published ?? null, ["cms-published", key], {
      tags: [CMS_TAG, cmsTag(key)],
    });
    cachedReaders.set(key, reader);
  }
  return reader;
}

async function storedPublished(key: SectionKey): Promise<unknown> {
  try {
    return await cachedPublished(key)();
  } catch (err) {
    unstable_rethrow(err);
    if (isStoreError(err)) throw err;
    // No Next cache in this context (e.g. a script): read directly.
    return (await readRow(key))?.published ?? null;
  }
}

const loadSection = cache(async (key: SectionKey, mode: "auto" | "published"): Promise<unknown> => {
  try {
    if (mode === "auto" && (await previewEnabled())) {
      const row = await readRow(key);
      return resolveSection(key, row?.draft ?? row?.published ?? null);
    }
    return resolveSection(key, await storedPublished(key));
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[cms] Using defaults for "${key}":`, errorCode(err) ?? (err as Error)?.message ?? "unknown error");
    return resolveSection(key, null);
  }
});

/**
 * Content for a public page: the published version (or, in an admin preview,
 * the draft) merged over the defaults and validated. Never throws.
 */
export function getContent<K extends SectionKey>(key: K): Promise<SectionContent<K>> {
  return loadSection(key, "auto") as Promise<SectionContent<K>>;
}

/**
 * The published version only, ignoring any preview. For server-side behaviour
 * that must not follow an unpublished draft: accepting enquiries, choosing who
 * is emailed.
 */
export function getPublishedContent<K extends SectionKey>(key: K): Promise<SectionContent<K>> {
  return loadSection(key, "published") as Promise<SectionContent<K>>;
}

// ---------------------------------------------------------------------------
// Typed helpers for the public site
// ---------------------------------------------------------------------------

export const getHomepage = () => getContent("homepage");

/** /services content with hidden stages and formats removed. */
export async function getServices() {
  const s = await getContent("services");
  return { ...s, stages: s.stages.filter((x) => x.visible), formats: s.formats.filter((x) => x.visible) };
}

export const getHowItWorks = () => getContent("howItWorks");

/** The team section with hidden people removed. */
export async function getTeam() {
  const t = await getContent("team");
  return { ...t, members: t.members.filter((m) => m.visible) };
}

const tel = (e164: string) => `tel:${e164}`;

export type ContactInfo = {
  name: string;
  email: string;
  phone: { display: string; e164: string; href: string };
  primaryContact: { name: string; role: string; phone: { display: string; e164: string; href: string }; linkedin: string };
  location: { city: string; region: string; country: string; countryCode: string };
  showCompanyPhone: boolean;
  showPrimaryContactLinkedin: boolean;
};

/** Contact details shaped like `site` in lib/site.ts (phone hrefs included), so call sites swap over easily. */
export async function getContactInfo(opts: { published?: boolean } = {}): Promise<ContactInfo> {
  const c = await (opts.published ? getPublishedContent("contact") : getContent("contact"));
  return {
    name: site.name,
    email: c.email,
    phone: { ...c.phone, href: tel(c.phone.e164) },
    primaryContact: { ...c.primaryContact, phone: { ...c.primaryContact.phone, href: tel(c.primaryContact.phone.e164) } },
    location: { ...c.location, countryCode: site.location.countryCode },
    showCompanyPhone: c.visibility.showCompanyPhone,
    showPrimaryContactLinkedin: c.visibility.showPrimaryContactLinkedin,
  };
}

export type PageSeoContent = {
  title: string;
  description: string;
  /** null = derive from the title, as before. */
  ogTitle: string | null;
  /** null = same as the description. */
  ogDescription: string | null;
  /** "/" and "/about" use their title as is; other pages get " | Dev Syndicate" appended. */
  absoluteTitle: boolean;
};

export async function getSeo(path: SeoPath): Promise<PageSeoContent> {
  const p = (await getContent("seo")).pages[path];
  return {
    title: p.title,
    description: p.description,
    ogTitle: p.ogTitle || null,
    ogDescription: p.ogDescription || null,
    absoluteTitle: ABSOLUTE_TITLE_PATHS.includes(path),
  };
}

export type FormConfig = {
  enabled: boolean;
  confirmationMessage: string;
  privacyHref: string;
  /** Offered enquiry types, in the form's usual order. */
  enquiryTypes: { value: string; label: string }[];
};

/**
 * What the contact form offers. Never includes the notification recipient.
 * Pass `{ published: true }` in the API route, so an admin's preview can't
 * change what the server accepts.
 */
export async function getFormConfig(opts: { published?: boolean } = {}): Promise<FormConfig> {
  const f = await (opts.published ? getPublishedContent("contactForm") : getContent("contactForm"));
  const enabled = new Set<string>(f.enabledEnquiryTypes);
  return {
    enabled: f.enabled,
    confirmationMessage: f.confirmationMessage,
    privacyHref: f.privacyHref,
    enquiryTypes: eventTypes.filter((t) => enabled.has(t.value)).map((t) => ({ value: t.value, label: t.label })),
  };
}

/**
 * Where lead notifications go: the published contact-form recipient, else
 * CONTACT_EMAIL, else the published company email. Published content only.
 */
export async function getNotificationAddress(): Promise<string> {
  const [form, contact] = await Promise.all([getPublishedContent("contactForm"), getPublishedContent("contact")]);
  return form.notificationRecipient || process.env.CONTACT_EMAIL || contact.email;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type SectionState<K extends SectionKey> = {
  key: K;
  info: SectionInfo;
  /** The saved draft, resolved over the defaults, or null when there is none. */
  draft: SectionContent<K> | null;
  /** The live version, or null when nothing has been published (the site shows the defaults). */
  published: SectionContent<K> | null;
  defaults: SectionContent<K>;
  /** What an editor should open: draft ?? published ?? defaults. */
  current: SectionContent<K>;
  draftSavedAt: string | null;
  draftSavedBy: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  /** A draft exists and differs from what is live. */
  hasUnpublishedChanges: boolean;
  /** Where content is stored; null = nowhere configured (publishing is unavailable). */
  storeKind: "postgres" | "file" | null;
};

const STORE_HINT = "Couldn't read site content. If the database is new, run `npm run db:setup`.";

function stateFrom<K extends SectionKey>(key: K, row: ContentRow | null, storeKind: SectionState<K>["storeKind"]): SectionState<K> {
  const defaults = defaultsFor(key);
  const draft = row?.draft != null ? resolveSection(key, row.draft) : null;
  const published = row?.published != null ? resolveSection(key, row.published) : null;
  const live = published ?? defaults;
  return {
    key,
    info: SECTIONS[key],
    draft,
    published,
    defaults,
    current: draft ?? live,
    draftSavedAt: row?.draftSavedAt ?? null,
    draftSavedBy: row?.draftSavedBy ?? null,
    publishedAt: row?.publishedAt ?? null,
    publishedBy: row?.publishedBy ?? null,
    hasUnpublishedChanges: draft !== null && !sameContent(draft, live),
    storeKind,
  };
}

/** Everything an editor needs for one section. Admin only; throws if the store can't be read. */
export async function getSectionState<K extends SectionKey>(key: K): Promise<SectionState<K>> {
  await requireAdmin();
  if (!isSectionKey(key)) throw new Error("Unknown content section.");
  const store = await getContentStore();
  if (!store) return stateFrom(key, null, null);
  let row: ContentRow | null;
  try {
    row = await store.getRow(key);
  } catch (err) {
    console.error(`[cms] Couldn't read "${key}":`, errorCode(err) ?? "unknown error");
    throw new ContentStoreError(STORE_HINT, errorCode(err));
  }
  return stateFrom(key, row, store.kind);
}

export type SectionSummary = {
  key: SectionKey;
  label: string;
  summary: string;
  adminHref: string;
  publicPaths: string[];
  publishedAt: string | null;
  publishedBy: string | null;
  draftSavedAt: string | null;
  hasUnpublishedChanges: boolean;
};

/**
 * Every section with its publish state, in admin order. Admin only. If the
 * store can't be read, sections are listed without state (and the error logged),
 * so a dashboard that shows this list still renders.
 */
export async function listSections(): Promise<SectionSummary[]> {
  await requireAdmin();
  const store = await getContentStore();
  let rows: ContentRow[] = [];
  if (store) {
    try {
      rows = await store.listRows();
    } catch (err) {
      console.error("[cms] Couldn't list content:", errorCode(err) ?? "unknown error");
    }
  }
  const byKey = new Map(rows.filter((r) => isSectionKey(r.section)).map((r) => [r.section, r]));
  return SECTION_KEYS.map((key) => {
    const s = stateFrom(key, byKey.get(key) ?? null, store?.kind ?? null);
    const { label, summary, adminHref, publicPaths } = SECTIONS[key];
    return {
      key,
      label,
      summary,
      adminHref,
      publicPaths: [...publicPaths],
      publishedAt: s.publishedAt,
      publishedBy: s.publishedBy,
      draftSavedAt: s.draftSavedAt,
      hasUnpublishedChanges: s.hasUnpublishedChanges,
    };
  });
}

/** Published versions of a section, newest first (at most 20). Admin only. */
export async function listRevisions(key: SectionKey): Promise<RevisionMeta[]> {
  await requireAdmin();
  if (!isSectionKey(key)) return [];
  const store = await getContentStore();
  if (!store) return [];
  try {
    return await store.listRevisions(key);
  } catch (err) {
    console.error(`[cms] Couldn't list revisions for "${key}":`, errorCode(err) ?? "unknown error");
    throw new ContentStoreError(STORE_HINT, errorCode(err));
  }
}

export type ResolvedRevision<K extends SectionKey = SectionKey> = RevisionMeta & { section: K; content: SectionContent<K> };

/** One published version, resolved like live content. Null if unknown. Admin only. */
export async function getRevision(id: string): Promise<ResolvedRevision | null> {
  await requireAdmin();
  const store = await getContentStore();
  if (!store || typeof id !== "string") return null;
  const rev = await store.getRevision(id);
  if (!rev || !isSectionKey(rev.section)) return null;
  return { id: rev.id, section: rev.section, publishedAt: rev.publishedAt, publishedBy: rev.publishedBy, content: resolveSection(rev.section, rev.content) };
}

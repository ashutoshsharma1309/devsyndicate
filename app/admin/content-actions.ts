"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { audit } from "@/lib/admin/audit";
import { actorLabel, checkPassword, requireAdmin, type AdminSession } from "@/lib/auth/admin";
import { verifyPassword } from "@/lib/auth/password";
import {
  cmsTag,
  contentFieldErrors,
  defaultsFor,
  isSectionKey,
  resolveSection,
  schemas,
  SECTIONS,
  type SectionKey,
} from "@/lib/cms";
import { deepMerge } from "@/lib/cms/merge";
import { getContentStore } from "@/lib/cms/store";
import type { ContentRow, ContentStore } from "@/lib/cms/types";
import { getLeadStore } from "@/lib/leads/store";
import { clearRateLimit, peekRateLimit, rateLimit } from "@/lib/rate-limit";

/**
 * Content editing actions for the admin. Every action re-checks the session,
 * validates on the server with the section's schema, and returns a result
 * instead of throwing.
 *
 * `data` is the section content: an object, a JSON string, or a FormData with
 * the JSON in a "data" field. A partial object is merged over what the editor
 * currently sees (the draft, else the live content, else the defaults) before
 * validation, so a key left out is never silently reset. `extra` (or the FormData itself) may carry
 * "currentPassword", which publishing requires when the contact form's
 * notification recipient changes.
 */

export type ContentActionResult = {
  ok: boolean;
  error?: string;
  /** Field path ("hero.headline.0", "members.1.linkedin", "currentPassword") → message. */
  fieldErrors?: Record<string, string>;
  /** ISO time the draft was saved or the content published. */
  savedAt?: string;
};

type Extra = FormData | { currentPassword?: unknown } | null | undefined;

const MAX_JSON_CHARS = 200_000;
const PASSWORD_WINDOW_MS = 15 * 60_000;
const MAX_PASSWORD_FAILURES = 5;

const fail = (error: string, fieldErrors?: Record<string, string>): ContentActionResult => ({
  ok: false,
  error,
  ...(fieldErrors ? { fieldErrors } : {}),
});

const UNKNOWN_SECTION = fail("Unknown content section.");
const NO_STORE = fail("Content storage isn't configured on this server, so changes can't be saved.");

function storeFailure(err: unknown, verb: string): ContentActionResult {
  const code = (err as { code?: string } | null)?.code;
  console.error(`[cms] Couldn't ${verb}:`, code ?? "unknown error");
  if (code === "42P01") return fail(`Couldn't ${verb}: the content tables don't exist yet. Run \`npm run db:setup\`.`);
  return fail(`Couldn't ${verb}. Nothing was changed. Try again in a moment.`);
}

/** The submitted content and current password, from any of the accepted shapes. */
function readInput(data: unknown, extra: Extra): { content: unknown; currentPassword: string } | { error: string } {
  let content = data;
  let currentPassword: unknown = undefined;
  if (data instanceof FormData) {
    content = data.get("data");
    currentPassword = data.get("currentPassword");
  }
  if (extra instanceof FormData) currentPassword = extra.get("currentPassword") ?? currentPassword;
  else if (extra && typeof extra === "object" && "currentPassword" in extra) currentPassword = extra.currentPassword;

  if (typeof content === "string") {
    if (content.length > MAX_JSON_CHARS) return { error: "That content is too large to save." };
    try {
      content = JSON.parse(content);
    } catch {
      return { error: "The content couldn't be read. Reload the editor and try again." };
    }
  } else {
    let size = 0;
    try {
      size = JSON.stringify(content ?? null).length;
    } catch {
      return { error: "The content couldn't be read. Reload the editor and try again." };
    }
    if (size > MAX_JSON_CHARS) return { error: "That content is too large to save." };
  }
  if (typeof content !== "object" || content === null || Array.isArray(content)) {
    return { error: "The content couldn't be read. Reload the editor and try again." };
  }
  return { content, currentPassword: typeof currentPassword === "string" ? currentPassword.slice(0, 500) : "" };
}

/** The content an editor currently sees: draft ?? published ?? defaults. */
const currentOf = (key: SectionKey, row: ContentRow | null) => resolveSection(key, row?.draft ?? row?.published ?? null);

/** Strict validation (no fallbacks): what gets stored is exactly what the editor will see. */
function validate(key: SectionKey, content: unknown, base: unknown): { data: unknown } | { result: ContentActionResult } {
  const parsed = schemas[key].safeParse(deepMerge(base, content));
  if (parsed.success) return { data: parsed.data };
  return { result: fail("Some fields need attention.", contentFieldErrors(parsed.error.issues)) };
}

/** The signed-in admin's own password: ADMIN_PASSWORD_HASH for the primary admin, else their account's hash. */
async function passwordMatches(session: AdminSession, password: string): Promise<boolean> {
  if (session.isOwner) return checkPassword(password);
  const store = await getLeadStore();
  const account = store ? await store.getAdmin(session.id) : null;
  if (!account || account.disabled) return false;
  return verifyPassword(password, account.passwordHash);
}

/** Null when the password is right; otherwise the result to return. Counts failures only. */
async function confirmPassword(session: AdminSession, password: string): Promise<ContentActionResult | null> {
  if (!password) {
    return fail("Confirm your password to change who is notified.", {
      currentPassword: "Enter your current password to change the notification recipient.",
    });
  }
  const key = `cms-password:${session.id}`;
  const limit = peekRateLimit(key, MAX_PASSWORD_FAILURES);
  if (!limit.ok) return fail(`Too many wrong passwords. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`);
  let ok = false;
  try {
    ok = await passwordMatches(session, password);
  } catch (err) {
    console.error("[cms] Couldn't check the password:", (err as { code?: string })?.code ?? "unknown error");
    return fail("Couldn't check your password. Try again in a moment.");
  }
  if (!ok) {
    rateLimit(key, MAX_PASSWORD_FAILURES, PASSWORD_WINDOW_MS);
    return fail("That password isn't right.", { currentPassword: "That password isn't right." });
  }
  clearRateLimit(key);
  return null;
}

/** Public pages showing `key`, plus the whole site for sections in the layout. */
function revalidateSection(key: SectionKey) {
  revalidateTag(cmsTag(key), { expire: 0 });
  const info = SECTIONS[key];
  for (const path of info.publicPaths) revalidatePath(path);
  if (key === "contactForm" || key === "contact") revalidatePath("/contact/[outcome]", "page");
  if (info.siteWide) revalidatePath("/", "layout");
}

async function storeOrFail(): Promise<ContentStore | ContentActionResult> {
  return (await getContentStore()) ?? NO_STORE;
}

const isResult = (v: unknown): v is ContentActionResult => typeof v === "object" && v !== null && "ok" in v;

/** Saves `data` as the section's draft. Nothing changes on the public site. */
export async function saveDraft(key: SectionKey, data: unknown, extra?: Extra): Promise<ContentActionResult> {
  const session = await requireAdmin();
  if (!isSectionKey(key)) return UNKNOWN_SECTION;
  const input = readInput(data, extra);
  if ("error" in input) return fail(input.error);
  const store = await storeOrFail();
  if (isResult(store)) return store;

  let savedAt: string;
  try {
    const valid = validate(key, input.content, currentOf(key, await store.getRow(key)));
    if ("result" in valid) return valid.result;
    savedAt = await store.saveDraft(key, valid.data, actorLabel(session));
  } catch (err) {
    return storeFailure(err, "save the draft");
  }
  await audit(session, "content_saved", { detail: `${SECTIONS[key].label}: draft saved` });
  return { ok: true, savedAt };
}

/**
 * Publishes `data` (or, when `data` is null/undefined, the saved draft):
 * validates it, stores it as live with a revision, clears the draft and
 * refreshes every page that shows it.
 */
export async function publish(key: SectionKey, data?: unknown, extra?: Extra): Promise<ContentActionResult> {
  const session = await requireAdmin();
  if (!isSectionKey(key)) return UNKNOWN_SECTION;
  const store = await storeOrFail();
  if (isResult(store)) return store;

  let row: ContentRow | null;
  try {
    row = await store.getRow(key);
  } catch (err) {
    return storeFailure(err, "publish");
  }

  let content: unknown;
  let currentPassword = "";
  if (data === null || data === undefined) {
    if (row?.draft == null) return fail("There's no draft to publish.");
    content = row.draft;
    const input = readInput({}, extra);
    if (!("error" in input)) currentPassword = input.currentPassword;
  } else {
    const input = readInput(data, extra);
    if ("error" in input) return fail(input.error);
    content = input.content;
    currentPassword = input.currentPassword;
  }
  const valid = validate(key, content, currentOf(key, row));
  if ("result" in valid) return valid.result;

  let detail = SECTIONS[key].label;
  if (key === "contactForm") {
    const live = resolveSection("contactForm", row?.published ?? null);
    const next = valid.data as { notificationRecipient: string };
    if (next.notificationRecipient !== live.notificationRecipient) {
      const denied = await confirmPassword(session, currentPassword);
      if (denied) return denied;
      detail += " (notification recipient changed)";
    }
  }
  if (key === "contact") {
    // The company email is also the fallback recipient for enquiry notifications (when no
    // recipient is set under Contact form and CONTACT_EMAIL isn't configured), so changing it
    // gets the same password check as changing the recipient directly.
    const live = resolveSection("contact", row?.published ?? null);
    const next = valid.data as { email: string };
    if (next.email.trim().toLowerCase() !== live.email.trim().toLowerCase()) {
      const denied = await confirmPassword(session, currentPassword);
      if (denied) return denied;
      detail += " (company email changed)";
    }
  }

  let savedAt: string;
  try {
    savedAt = await store.publish(key, valid.data, actorLabel(session));
  } catch (err) {
    return storeFailure(err, "publish");
  }
  revalidateSection(key);
  await audit(session, "content_published", { detail });
  return { ok: true, savedAt };
}

/** Deletes the draft. The live content is unchanged. */
export async function discardDraft(key: SectionKey): Promise<ContentActionResult> {
  const session = await requireAdmin();
  if (!isSectionKey(key)) return UNKNOWN_SECTION;
  const store = await storeOrFail();
  if (isResult(store)) return store;
  try {
    await store.discardDraft(key);
  } catch (err) {
    return storeFailure(err, "discard the draft");
  }
  await audit(session, "content_saved", { detail: `${SECTIONS[key].label}: draft discarded` });
  return { ok: true };
}

/** Copies a published revision into the draft, to review and publish again. */
export async function revertToRevision(key: SectionKey, revisionId: string): Promise<ContentActionResult> {
  const session = await requireAdmin();
  if (!isSectionKey(key)) return UNKNOWN_SECTION;
  const store = await storeOrFail();
  if (isResult(store)) return store;

  let savedAt: string;
  let publishedAt: string;
  try {
    const rev = typeof revisionId === "string" ? await store.getRevision(revisionId) : null;
    if (!rev || rev.section !== key) return fail("That version no longer exists.");
    publishedAt = rev.publishedAt;
    savedAt = await store.saveDraft(key, resolveSection(key, rev.content), actorLabel(session));
  } catch (err) {
    return storeFailure(err, "restore that version");
  }
  await audit(session, "content_reverted", {
    detail: `${SECTIONS[key].label}: draft from the version published ${publishedAt}`,
  });
  return { ok: true, savedAt };
}

/** Puts the original website copy into the draft, to review and publish. */
export async function resetToDefaults(key: SectionKey): Promise<ContentActionResult> {
  const session = await requireAdmin();
  if (!isSectionKey(key)) return UNKNOWN_SECTION;
  const store = await storeOrFail();
  if (isResult(store)) return store;
  let savedAt: string;
  try {
    savedAt = await store.saveDraft(key, defaultsFor(key), actorLabel(session));
  } catch (err) {
    return storeFailure(err, "reset the draft");
  }
  await audit(session, "content_reverted", { detail: `${SECTIONS[key].label}: draft reset to the original copy` });
  return { ok: true, savedAt };
}

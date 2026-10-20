"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod/mini";
import { audit } from "@/lib/admin/audit";
import {
  checkPassword,
  endSession,
  loginMode,
  ownerLoginAllowed,
  requireAdmin,
  sessionFromCookie,
  startSession,
  type AdminSession,
  type LoginMode,
} from "@/lib/auth/admin";
import { generatePassword, hashPassword, verifyPassword } from "@/lib/auth/password";
import { safeAdminPath } from "@/lib/auth/session";
import { getLeadStore } from "@/lib/leads/store";
import { contactFields, isLeadStatus, leadStatuses, type ContactFields, type LeadStore } from "@/lib/leads/types";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { leadSchema } from "@/lib/validation/lead";

export type ActionState = { ok?: boolean; error?: string; message?: string; at?: number };

const LOGIN_WINDOW_MS = 15 * 60_000;
const MAX_LOGIN_FAILURES = 10;

// One message for every failure, so the form doesn't reveal which emails have accounts.
const NAMED_LOGIN_ERROR = "That email and password don't match an active account.";

// Verified against when the email has no account, so a miss takes as long as a wrong password.
let dummyHash: Promise<string> | undefined;

/** Only a plausible address goes into the log, so a password typed into the email box never does. */
const loggableEmail = (email: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null);

async function authenticate(
  mode: LoginMode,
  store: LeadStore | null,
  email: string,
  password: string,
): Promise<AdminSession | null> {
  if (mode === "named" && email) {
    if (!store) return null;
    try {
      const account = await store.findAdminByEmail(email);
      dummyHash ??= hashPassword(generatePassword());
      const ok = await verifyPassword(password, account?.passwordHash ?? (await dummyHash));
      if (!account || !ok || account.disabled) return null;
      return { id: account.id, name: account.name, email: account.email, isOwner: false };
    } catch (err) {
      console.error("[auth] Couldn't check the admin account:", (err as { code?: string })?.code ?? "unknown error");
      return null;
    }
  }
  // Bootstrap, or break-glass (ADMIN_ALLOW_OWNER_LOGIN) with the email left empty.
  if (!ownerLoginAllowed(mode) || !(await checkPassword(password))) return null;
  return { id: "owner", name: "Owner", email: null, isOwner: true };
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const mode = await loginMode();
  if (mode === "unconfigured") return { error: "Admin access isn't configured on this server." };

  const ip = clientIp(await headers());
  // Per server instance; the store-backed count below holds across instances.
  const limit = rateLimit(`login:${ip}`, MAX_LOGIN_FAILURES, LOGIN_WINDOW_MS);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.` };

  const store = await getLeadStore();
  const failureKey = `login:${hashIp(ip)}`;
  if (store) {
    try {
      const failures = await store.countLoginFailures(failureKey, new Date(Date.now() - LOGIN_WINDOW_MS));
      if (failures >= MAX_LOGIN_FAILURES) return { error: "Too many attempts. Try again in 15 minutes." };
    } catch (err) {
      console.error("[auth] Couldn't check sign-in failures:", (err as { code?: string })?.code ?? "unknown error");
    }
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const password = formData.get("password");
  const session = typeof password === "string" && password ? await authenticate(mode, store, email, password) : null;

  if (!session) {
    await store?.recordLoginFailure(failureKey).catch(() => undefined);
    await audit(null, "login_failed", { detail: loggableEmail(email) });
    return { error: mode === "named" ? NAMED_LOGIN_ERROR : "That password isn't right." };
  }

  await store?.clearLoginFailures(failureKey).catch(() => undefined);
  if (!session.isOwner) await store?.touchAdminLogin(session.id).catch(() => undefined);
  await startSession(session);
  await audit(session, "login");
  redirect(safeAdminPath(formData.get("next")) ?? "/admin/leads");
}

export async function logout() {
  // Read before the cookie goes, so the log says who signed out.
  const session = await sessionFromCookie();
  if (session) await audit(session, "logout");
  await endSession();
  redirect("/admin/login");
}

async function storeOrThrow() {
  const store = await getLeadStore();
  if (!store) throw new Error("Lead storage is not configured.");
  return store;
}

export async function updateLeadStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!isLeadStatus(status)) return { error: "Unknown status.", at: Date.now() };
  let before;
  try {
    const store = await storeOrThrow();
    before = (await store.get(id))?.lead;
    if (!before) return { error: "That lead no longer exists.", at: Date.now() };
    if (before.status !== status) await store.updateStatus(id, status);
  } catch {
    return { error: "Couldn't update the status. Try again.", at: Date.now() };
  }
  if (before.status !== status) {
    await audit(session, "status_changed", { leadId: id, leadLabel: before.institution, detail: `${before.status} → ${status}` });
  }
  revalidatePath("/admin", "layout");
  const label = leadStatuses.find((s) => s.value === status)?.label;
  return { ok: true, message: `Status set to ${label}.`, at: Date.now() };
}

export async function addLeadNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a note first." };
  if (body.length > 4000) return { error: "Keep notes under 4,000 characters." };
  let lead;
  try {
    const store = await storeOrThrow();
    lead = (await store.get(id))?.lead;
    if (!lead) return { error: "That lead no longer exists." };
    await store.addNote(id, body);
  } catch {
    return { error: "Couldn't save the note. Try again." };
  }
  // The note text stays out of the log; it may hold personal details.
  await audit(session, "note_added", { leadId: id, leadLabel: lead.institution });
  revalidatePath(`/admin/leads/${id}`);
  return { ok: true, message: "Note added.", at: Date.now() };
}

// Same field rules as the contact form, so a corrected lead is as valid as a submitted one.
const contactSchema = z.object({
  name: leadSchema.shape.name,
  designation: leadSchema.shape.designation,
  email: leadSchema.shape.email,
  phone: leadSchema.shape.phone,
  institution: leadSchema.shape.institution,
  city: leadSchema.shape.city,
});

export type ContactState = ActionState & {
  /** First error per field. */
  fieldErrors?: Partial<Record<keyof ContactFields, string>>;
  /** What was submitted, so a failed save doesn't wipe the admin's edits. */
  values?: Record<keyof ContactFields, string>;
};

export async function updateLeadContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const values = Object.fromEntries(contactFields.map((k) => [k, String(formData.get(k) ?? "")])) as Record<
    keyof ContactFields,
    string
  >;
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactFields | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors, values, at: Date.now() };
  }
  let changed: (keyof ContactFields)[] = [];
  let label = "";
  try {
    const store = await storeOrThrow();
    const before = (await store.get(id))?.lead;
    if (!before) return { error: "That lead no longer exists.", values, at: Date.now() };
    changed = contactFields.filter((k) => (before[k] ?? "") !== parsed.data[k]);
    // Labelled with the corrected name, which is what the lead shows from now on.
    label = parsed.data.institution;
    await store.updateContact(id, parsed.data);
  } catch {
    return { error: "Couldn't save the contact details. Try again.", values, at: Date.now() };
  }
  // Field names only, never the old or new values.
  if (changed.length > 0) {
    await audit(session, "contact_updated", { leadId: id, leadLabel: label, detail: `fields: ${changed.join(", ")}` });
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Contact details saved.", values: parsed.data, at: Date.now() };
}

export async function deleteLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "delete") return { error: "Confirm the delete first.", at: Date.now() };
  let label: string | null = null;
  try {
    const store = await storeOrThrow();
    label = (await store.get(id))?.lead.institution ?? null;
    await store.delete(id);
  } catch {
    return { error: "Couldn't delete the lead. Try again.", at: Date.now() };
  }
  // The institution name is all that remains of the lead; it's what the log shows afterwards.
  if (label !== null) await audit(session, "lead_deleted", { leadId: id, leadLabel: label });
  revalidatePath("/admin", "layout");
  // The list shows a confirmation toast for ?deleted=1.
  redirect("/admin/leads?deleted=1");
}

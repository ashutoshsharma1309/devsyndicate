"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod/mini";
import { adminConfigured, checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth/admin";
import { safeAdminPath } from "@/lib/auth/session";
import { getLeadStore } from "@/lib/leads/store";
import { contactFields, isLeadStatus, leadStatuses, type ContactFields } from "@/lib/leads/types";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { leadSchema } from "@/lib/validation/lead";

export type ActionState = { ok?: boolean; error?: string; message?: string; at?: number };

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!adminConfigured()) return { error: "Admin access isn't configured on this server." };

  const ip = clientIp(await headers());
  const limit = rateLimit(`login:${ip}`, 5, 15 * 60_000);
  if (!limit.ok) return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.` };

  const password = formData.get("password");
  if (typeof password !== "string" || !password || !(await checkPassword(password))) {
    return { error: "That password isn't right." };
  }
  await startSession();
  redirect(safeAdminPath(formData.get("next")) ?? "/admin/leads");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

async function storeOrThrow() {
  const store = await getLeadStore();
  if (!store) throw new Error("Lead storage is not configured.");
  return store;
}

export async function updateLeadStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  if (!isLeadStatus(status)) return { error: "Unknown status.", at: Date.now() };
  try {
    await (await storeOrThrow()).updateStatus(id, status);
  } catch {
    return { error: "Couldn't update the status. Try again.", at: Date.now() };
  }
  revalidatePath("/admin", "layout");
  const label = leadStatuses.find((s) => s.value === status)?.label;
  return { ok: true, message: `Status set to ${label}.`, at: Date.now() };
}

export async function addLeadNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a note first." };
  if (body.length > 4000) return { error: "Keep notes under 4,000 characters." };
  try {
    await (await storeOrThrow()).addNote(id, body);
  } catch {
    return { error: "Couldn't save the note. Try again." };
  }
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
  await requireAdmin();
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
  try {
    await (await storeOrThrow()).updateContact(id, parsed.data);
  } catch {
    return { error: "Couldn't save the contact details. Try again.", values, at: Date.now() };
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Contact details saved.", values: parsed.data, at: Date.now() };
}

export async function deleteLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "delete") return { error: "Confirm the delete first.", at: Date.now() };
  try {
    await (await storeOrThrow()).delete(id);
  } catch {
    return { error: "Couldn't delete the lead. Try again.", at: Date.now() };
  }
  revalidatePath("/admin", "layout");
  // The list shows a confirmation toast for ?deleted=1.
  redirect("/admin/leads?deleted=1");
}

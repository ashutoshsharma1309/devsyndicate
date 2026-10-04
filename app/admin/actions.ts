"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminConfigured, checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { isLeadStatus, leadStatuses } from "@/lib/leads/types";
import { clientIp, rateLimit } from "@/lib/rate-limit";

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
  redirect("/admin/leads");
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

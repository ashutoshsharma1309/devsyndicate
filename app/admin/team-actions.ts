"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod/mini";
import type { ActionState } from "@/app/admin/actions";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { generatePassword, hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/auth/password";
import { getLeadStore } from "@/lib/leads/store";
import type { AdminAccount } from "@/lib/leads/types";

/**
 * A temporary password is returned in the action result only, so it shows once
 * in the admin's browser and is never stored in plain text, logged or audited.
 */
export type TeamState = ActionState & {
  /** The temporary password, shown once. */
  password?: string;
  /** Who the temporary password is for: "Name <email>". */
  account?: string;
  fieldErrors?: { name?: string; email?: string };
  values?: { name: string; email: string };
};

export type PasswordState = ActionState & {
  fieldErrors?: { current?: string; next?: string; confirm?: string };
};

const NO_STORE = "Admin accounts need lead storage. Set DATABASE_URL and run npm run db:setup.";

const accountLabel = (a: Pick<AdminAccount, "name" | "email">) => `${a.name} <${a.email}>`;

const newAdminSchema = z.object({
  name: z.pipe(
    z.string(),
    z.transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, "").trim()),
  ).check(z.minLength(2, "Enter their name."), z.maxLength(100, "Keep this under 100 characters.")),
  email: z.pipe(
    z.string(),
    z.transform((v) => v.trim().toLowerCase()),
  ).check(z.email("Enter a valid email address."), z.maxLength(200, "Keep this under 200 characters.")),
});

export async function createAdminAccount(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const session = await requireAdmin();
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = newAdminSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: TeamState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "email" | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Check the highlighted fields.", fieldErrors, values, at: Date.now() };
  }
  const store = await getLeadStore();
  if (!store) return { error: NO_STORE, values, at: Date.now() };

  const password = generatePassword();
  let account: AdminAccount;
  try {
    account = await store.createAdmin({ ...parsed.data, passwordHash: await hashPassword(password) });
  } catch (err) {
    if ((err as Error)?.message === "duplicate_email") {
      return {
        error: "An account with that email already exists.",
        fieldErrors: { email: "An account with that email already exists." },
        values,
        at: Date.now(),
      };
    }
    return { error: "Couldn't create the account. Try again.", values, at: Date.now() };
  }
  await audit(session, "admin_created", { detail: accountLabel(account) });
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: `Account created for ${account.name}.`,
    password,
    account: accountLabel(account),
    at: Date.now(),
  };
}

/** Disables or re-enables an account. `disabled` is "true" or "false". */
export async function setAdminDisabled(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const disable = formData.get("disabled") === "true";
  const store = await getLeadStore();
  if (!store) return { error: NO_STORE, at: Date.now() };

  let target: AdminAccount | null;
  try {
    target = await store.getAdmin(id);
    if (!target) return { error: "That account no longer exists.", at: Date.now() };
    if (target.disabled === disable) {
      return { ok: true, message: `${target.name} is already ${disable ? "disabled" : "active"}.`, at: Date.now() };
    }
    if (disable) {
      if (target.id === session.id) return { error: "You can't disable your own account.", at: Date.now() };
      // With no active accounts the panel falls back to the shared password, so keep at least one.
      if ((await store.countActiveAdmins()) <= 1) {
        return { error: "This is the last active account. Add or enable another one first.", at: Date.now() };
      }
    }
    await store.updateAdmin(id, { disabled: disable });
  } catch {
    return { error: "Couldn't update the account. Try again.", at: Date.now() };
  }
  await audit(session, "admin_updated", { detail: `${accountLabel(target)}: ${disable ? "disabled" : "enabled"}` });
  revalidatePath("/admin", "layout");
  return { ok: true, message: `${target.name} ${disable ? "can no longer sign in" : "can sign in again"}.`, at: Date.now() };
}

export async function resetAdminPassword(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id === session.id) return { error: "Change your own password under Account.", at: Date.now() };
  const store = await getLeadStore();
  if (!store) return { error: NO_STORE, at: Date.now() };

  const password = generatePassword();
  let target: AdminAccount | null;
  try {
    target = await store.getAdmin(id);
    if (!target) return { error: "That account no longer exists.", at: Date.now() };
    await store.updateAdmin(id, { passwordHash: await hashPassword(password) });
  } catch {
    return { error: "Couldn't reset the password. Try again.", at: Date.now() };
  }
  await audit(session, "admin_updated", { detail: `${accountLabel(target)}: password reset` });
  revalidatePath("/admin/team");
  return {
    ok: true,
    message: `New temporary password for ${target.name}.`,
    password,
    account: accountLabel(target),
    at: Date.now(),
  };
}

/** A named admin changes their own password. */
export async function changeOwnPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await requireAdmin();
  if (session.isOwner) {
    return { error: "The shared password is set on the server (ADMIN_PASSWORD_HASH), not here.", at: Date.now() };
  }
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fieldErrors: NonNullable<PasswordState["fieldErrors"]> = {};
  if (!current) fieldErrors.current = "Enter your current password.";
  if (next.length < MIN_PASSWORD_LENGTH) fieldErrors.next = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  // Long enough for any passphrase, short enough that hashing it can't be used to tie up the server.
  else if (next.length > 200) fieldErrors.next = "Keep this under 200 characters.";
  else if (next === current) fieldErrors.next = "Choose a password different from your current one.";
  if (!fieldErrors.next && confirm !== next) fieldErrors.confirm = "The two new passwords don't match.";
  if (Object.keys(fieldErrors).length > 0) return { error: "Check the highlighted fields.", fieldErrors, at: Date.now() };

  const store = await getLeadStore();
  if (!store) return { error: NO_STORE, at: Date.now() };
  try {
    const account = await store.getAdmin(session.id);
    if (!account || !(await verifyPassword(current, account.passwordHash))) {
      return {
        error: "Check the highlighted fields.",
        fieldErrors: { current: "That isn't your current password." },
        at: Date.now(),
      };
    }
    await store.updateAdmin(session.id, { passwordHash: await hashPassword(next) });
  } catch {
    return { error: "Couldn't change your password. Try again.", at: Date.now() };
  }
  await audit(session, "password_changed");
  return { ok: true, message: "Password changed. Use it next time you sign in.", at: Date.now() };
}

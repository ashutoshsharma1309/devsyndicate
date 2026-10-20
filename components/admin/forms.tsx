"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import {
  addLeadNote,
  deleteLead,
  login,
  updateLeadContact,
  updateLeadStatus,
  type ActionState,
  type ContactState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";
import { leadStatuses, type ActivityEntry, type ContactFields, type LeadStatus } from "@/lib/leads/types";
import { cn, formatDate } from "@/lib/utils";

/**
 * `next` is where to go after signing in; the action re-validates it.
 * "named": email + password. "owner" (bootstrap): the shared password only.
 * `allowOwner` (break-glass) lets the email be left empty for the shared password.
 */
export function LoginForm({
  disabled,
  next,
  mode,
  allowOwner = false,
}: {
  disabled: boolean;
  next?: string;
  mode: "named" | "owner";
  allowOwner?: boolean;
}) {
  const [state, action, pending] = useActionState(login, {} as ActionState);
  const named = mode === "named";
  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      {named && (
        <Field
          id="email"
          label="Email"
          required={!allowOwner}
          hint={allowOwner ? "Leave empty to use the shared password." : undefined}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required={!allowOwner}
            autoFocus
            disabled={disabled}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={allowOwner ? "email-hint" : undefined}
          />
        </Field>
      )}
      <Field id="password" label="Password" required error={state.error}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus={!named}
          disabled={disabled}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending || disabled}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function StatusForm({ id, status }: { id: string; status: LeadStatus }) {
  const [state, action, pending] = useActionState(updateLeadStatus, {} as ActionState);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="flex items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex-1">
        <label htmlFor="lead-status" className="mb-2 block text-sm font-medium">
          Status
        </label>
        {/* React resets forms after an action; keying on the saved status keeps the select in sync. */}
        <Select
          key={status}
          id="lead-status"
          name="status"
          defaultValue={status}
          disabled={pending}
          onChange={() => formRef.current?.requestSubmit()}
        >
          {leadStatuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      <noscript>
        <Button type="submit">Save</Button>
      </noscript>
      <Toast message={state.message ?? state.error} stamp={state.at} tone={state.error ? "error" : "success"} />
    </form>
  );
}

export function NoteForm({ id }: { id: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await addLeadNote(prev, fd);
    if (result.ok) formRef.current?.reset();
    return result;
  }, {} as ActionState);
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor="note-body" className="sr-only">
        Add a note
      </label>
      <Textarea
        id="note-body"
        name="body"
        rows={3}
        maxLength={4000}
        placeholder="Call notes, next steps, decision makers…"
        aria-invalid={state.error ? true : undefined}
        className="min-h-24"
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add note"}
        </Button>
      </div>
      <Toast message={state.message} stamp={state.at} />
    </form>
  );
}

type ContactValues = Record<keyof ContactFields, string>;

const contactInputs: { name: keyof ContactFields; label: string; required?: boolean; type?: string; autoComplete?: string }[] = [
  { name: "name", label: "Full name", required: true, autoComplete: "off" },
  { name: "designation", label: "Designation" },
  { name: "email", label: "Email", required: true, type: "email" },
  { name: "phone", label: "Phone", required: true, type: "tel" },
  { name: "institution", label: "Institution", required: true },
  { name: "city", label: "City" },
];

/** Corrects a lead's contact details (privacy policy: right to correction). */
export function ContactForm({ id, lead }: { id: string; lead: ContactValues }) {
  const [state, action, pending] = useActionState(updateLeadContact, {} as ContactState);
  // After a failed save, show what was typed rather than the stored values.
  const values = state.error && state.values ? state.values : lead;
  const submitRef = useRef<HTMLButtonElement>(null);

  // The submit button is disabled while saving, which drops focus to <body>. Put it back:
  // on the first invalid field after a failed save, otherwise on the button.
  useEffect(() => {
    if (!state.at) return;
    const firstInvalid = contactInputs.find((f) => state.fieldErrors?.[f.name]);
    if (firstInvalid) document.getElementById(`contact-${firstInvalid.name}`)?.focus();
    else submitRef.current?.focus();
  }, [state.at, state.fieldErrors]);

  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="id" value={id} />
      {/* Keyed so React's post-action form reset can't revert to stale defaults. Only the
          fields remount — the button and the toast's live region stay put, so focus and
          announcements survive a save. */}
      <div key={state.at} className="grid gap-5 sm:grid-cols-2">
        {contactInputs.map((f) => {
          const fid = `contact-${f.name}`;
          const error = state.fieldErrors?.[f.name];
          return (
            <Field key={f.name} id={fid} label={f.label} required={f.required} error={error}>
              <Input
                id={fid}
                name={f.name}
                type={f.type ?? "text"}
                defaultValue={values[f.name]}
                required={f.required}
                autoComplete={f.autoComplete ?? "off"}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(fid, error)}
              />
            </Field>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-4">
        {state.error && !state.fieldErrors && (
          <p className="mr-auto text-sm text-danger" role="alert">
            {state.error}
          </p>
        )}
        <Button ref={submitRef} type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
      <Toast message={state.message ?? state.error} stamp={state.at} tone={state.error ? "error" : "success"} />
    </form>
  );
}

/** Two-step delete: the first click only reveals the real (destructive) button. */
export function DeleteLeadForm({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteLead, {} as ActionState);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  const danger =
    "inline-flex h-11 items-center justify-center rounded-sm px-5 text-[0.9375rem] font-medium tracking-[-0.01em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60";

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className={`${danger} border border-danger/30 text-danger hover:border-danger hover:bg-danger/5`}
        >
          Delete lead
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-danger">
            This permanently deletes the lead and all its notes. It can&apos;t be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              ref={confirmRef}
              type="submit"
              name="confirm"
              value="delete"
              disabled={pending}
              className={`${danger} bg-danger text-white hover:bg-danger/90`}
            >
              {pending ? "Deleting…" : "Confirm permanent delete"}
            </button>
            <Button type="button" variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <Toast message={state.error} stamp={state.at} tone="error" />
    </form>
  );
}

/**
 * One-off confirmation after a redirect (e.g. ?deleted=1). Drops the query
 * param so a refresh or Back doesn't show it again.
 */
export function FlashToast({ message, param }: { message: string; param: string }) {
  const [stamp] = useState(() => Date.now());
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(param)) return;
    url.searchParams.delete(param);
    window.history.replaceState(window.history.state, "", url);
  }, [param]);
  return <Toast message={message} stamp={stamp} />;
}

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/account", label: "Account" },
] as const;

/** Panel navigation. Client-side only to mark the current section (layouts can't read the path). */
export function AdminNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  // On phones the nav scrolls sideways; keep the current section in view.
  useEffect(() => {
    const nav = navRef.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && current && nav.scrollWidth > nav.clientWidth) {
      const left = current.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
      nav.scrollLeft = left - (nav.clientWidth - current.offsetWidth) / 2;
    }
  }, [pathname]);
  return (
    <nav ref={navRef} aria-label="Admin" className={className}>
      <ul className="flex items-center gap-1 text-sm">
        {navItems.map((item) => {
          const current = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "block rounded-sm px-2.5 py-1.5 hover:bg-ink/5 hover:text-ink",
                  current ? "bg-ink/[0.06] font-medium text-ink" : "text-mute",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const statusLabel = (v: string) => leadStatuses.find((s) => s.value === v)?.label ?? v;

/** "Asha Rao <asha@x.in>: disabled" → ["Asha Rao <asha@x.in>", "disabled"]. */
function splitAdminDetail(detail: string): [string, string] {
  const i = detail.lastIndexOf(": ");
  return i === -1 ? [detail, ""] : [detail.slice(0, i), detail.slice(i + 2)];
}

/** One log entry as a sentence. `lead` is the lead's name or link, or null on that lead's own page. */
function describeActivity(e: ActivityEntry, lead: ReactNode | null): ReactNode {
  const subject = lead ?? "this lead";
  switch (e.action) {
    case "login":
      return "Signed in";
    case "login_failed":
      return e.detail ? <>Failed sign-in attempt as {e.detail}</> : "Failed sign-in attempt";
    case "logout":
      return "Signed out";
    case "status_changed": {
      const [from, to] = (e.detail ?? "").split(" → ");
      return to ? (
        <>
          Moved {subject} from {statusLabel(from)} to {statusLabel(to)}
        </>
      ) : (
        <>Changed the status of {subject}</>
      );
    }
    case "note_added":
      return <>Added a note to {subject}</>;
    case "contact_updated":
      return (
        <>
          Corrected contact details of {subject}
          {e.detail && <span className="text-mute"> ({e.detail.replace(/^fields: /, "")})</span>}
        </>
      );
    case "lead_deleted":
      return <>Deleted the lead {subject}</>;
    case "export":
      return <>Exported leads{e.detail && <span className="text-mute"> ({e.detail})</span>}</>;
    case "admin_created":
      return <>Added the admin account {e.detail ?? ""}</>;
    case "admin_updated": {
      const [account, change] = splitAdminDetail(e.detail ?? "");
      if (change === "disabled") return <>Disabled the admin account {account}</>;
      if (change === "enabled") return <>Re-enabled the admin account {account}</>;
      if (change === "password reset") return <>Reset the password for {account}</>;
      return <>Updated the admin account {e.detail ?? ""}</>;
    }
    case "password_changed":
      return "Changed their own password";
    default:
      return e.action;
  }
}

/**
 * The activity log as a list. `liveLeadIds`: leads that still exist, so only
 * those get a link; a deleted lead shows its stored name as plain text.
 * `onLeadPage` drops the lead's name, which the page already shows.
 */
export function ActivityList({
  entries,
  liveLeadIds = [],
  onLeadPage = false,
}: {
  entries: ActivityEntry[];
  liveLeadIds?: string[];
  onLeadPage?: boolean;
}) {
  const live = new Set(liveLeadIds);
  return (
    <ol className="divide-y divide-line">
      {entries.map((e) => {
        let lead: ReactNode = null;
        if (!onLeadPage && (e.leadId || e.leadLabel)) {
          const label = e.leadLabel || "a lead";
          lead =
            e.leadId && live.has(e.leadId) ? (
              <Link href={`/admin/leads/${e.leadId}`} className="font-medium text-signal underline-offset-4 hover:underline">
                {label}
              </Link>
            ) : (
              <span className="font-medium">{label}</span>
            );
        }
        const what = (
          <span className={cn("break-words", e.action === "login_failed" && "text-danger")}>
            {describeActivity(e, onLeadPage ? null : lead)}
          </span>
        );
        // The lead page's sidebar is narrow, so stack; the full log reads as columns.
        return onLeadPage ? (
          <li key={e.id} className="py-3.5 text-sm">
            <time dateTime={e.at} className="t-label block text-mute">
              {formatDate(e.at, true)}
            </time>
            <p className="mt-1.5">{what}</p>
            <p className="mt-0.5 break-words text-mute">{e.actor}</p>
          </li>
        ) : (
          <li key={e.id} className="grid gap-1 py-3.5 text-sm sm:grid-cols-[10.5rem_minmax(0,16rem)_1fr] sm:gap-4">
            <time dateTime={e.at} className="tabular-nums text-mute">
              {formatDate(e.at, true)}
            </time>
            <span className="break-words text-mute sm:text-ink">{e.actor}</span>
            {what}
          </li>
        );
      })}
    </ol>
  );
}

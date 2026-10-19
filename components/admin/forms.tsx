"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { leadStatuses, type ContactFields, type LeadStatus } from "@/lib/leads/types";

/** `next` is where to go after signing in; the action re-validates it. */
export function LoginForm({ disabled, next }: { disabled: boolean; next?: string }) {
  const [state, action, pending] = useActionState(login, {} as ActionState);
  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="password" label="Password" required error={state.error}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
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

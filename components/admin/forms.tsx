"use client";

import { useActionState, useRef } from "react";
import { addLeadNote, login, updateLeadStatus, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";
import { leadStatuses, type LeadStatus } from "@/lib/leads/types";

export function LoginForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(login, {} as ActionState);
  return (
    <form action={action} className="space-y-5">
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

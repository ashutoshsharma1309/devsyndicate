"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  changeOwnPassword,
  createAdminAccount,
  resetAdminPassword,
  setAdminDisabled,
  type PasswordState,
  type TeamState,
} from "@/app/admin/team-actions";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * The one place a temporary password is ever shown. It lives only in this
 * component's state, so leaving or reloading the page drops it for good.
 */
function TemporaryPassword({ password, account, onDone }: { password: string; account?: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus here so keyboard and screen-reader users land on the result.
  useEffect(() => panelRef.current?.focus(), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      // Clipboard blocked (permissions, insecure context): select it for a manual copy.
      const range = document.createRange();
      if (codeRef.current) range.selectNodeContents(codeRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label="Temporary password"
      className="rounded-md border border-signal/30 bg-signal/4 p-5 focus:outline-none"
    >
      <p className="text-sm font-medium">Temporary password{account && <> for {account}</>}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code
          ref={codeRef}
          className="select-all break-all rounded-sm border border-line bg-white px-3 py-2 font-mono text-[0.9375rem] tracking-wide"
        >
          {password}
        </code>
        <Button type="button" variant="secondary" onClick={copy} className="h-10">
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="mt-3 text-sm text-mute">
        It&apos;s shown only once and can&apos;t be recovered. Share it privately (in person or a direct message,
        not a group chat or email thread) and ask them to change it under <strong className="font-medium text-ink">Account</strong>{" "}
        after signing in.
      </p>
      <Button type="button" variant="ghost" onClick={onDone} className="mt-3 h-auto text-sm">
        Done — hide it
      </Button>
    </div>
  );
}

/** Shows the latest action's temporary password until dismissed or a newer action replaces it. */
function useShownPassword(state: TeamState) {
  const [hiddenAt, setHiddenAt] = useState<number | undefined>(undefined);
  const shown = state.password && state.at !== hiddenAt ? state.password : null;
  return { shown, hide: () => setHiddenAt(state.at) };
}

export function AddAdminForm({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(createAdminAccount, {} as TeamState);
  const { shown, hide } = useShownPassword(state);
  // After a failed save, keep what was typed; after a success, start empty.
  const values = state.error && state.values ? state.values : { name: "", email: "" };

  useEffect(() => {
    if (!state.at || !state.fieldErrors) return;
    const first = state.fieldErrors.name ? "admin-name" : state.fieldErrors.email ? "admin-email" : null;
    if (first) document.getElementById(first)?.focus();
  }, [state.at, state.fieldErrors]);

  return (
    <div className="space-y-5">
      <form action={action} noValidate className="space-y-5">
        <div key={state.at} className="grid gap-5 sm:grid-cols-2">
          <Field id="admin-name" label="Name" required error={state.fieldErrors?.name}>
            <Input
              id="admin-name"
              name="name"
              defaultValue={values.name}
              required
              maxLength={100}
              autoComplete="off"
              disabled={disabled}
              aria-invalid={state.fieldErrors?.name ? true : undefined}
              aria-describedby={describedBy("admin-name", state.fieldErrors?.name)}
            />
          </Field>
          <Field id="admin-email" label="Email" required error={state.fieldErrors?.email}>
            <Input
              id="admin-email"
              name="email"
              type="email"
              defaultValue={values.email}
              required
              maxLength={200}
              autoComplete="off"
              disabled={disabled}
              aria-invalid={state.fieldErrors?.email ? true : undefined}
              aria-describedby={describedBy("admin-email", state.fieldErrors?.email)}
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-4">
          {state.error && !state.fieldErrors && (
            <p className="mr-auto text-sm text-danger" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending || disabled}>
            {pending ? "Creating…" : "Create account"}
          </Button>
        </div>
      </form>
      {shown && <TemporaryPassword key={state.at} password={shown} account={state.account} onDone={hide} />}
      <Toast message={state.error ? undefined : state.message} stamp={state.at} />
    </div>
  );
}

/** Disable / re-enable and password reset for one account row. */
export function AdminRowActions({
  id,
  name,
  disabled,
  isSelf,
}: {
  id: string;
  name: string;
  disabled: boolean;
  isSelf: boolean;
}) {
  const [toggleState, toggle, toggling] = useActionState(setAdminDisabled, {} as TeamState);
  const [resetState, reset, resetting] = useActionState(resetAdminPassword, {} as TeamState);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const { shown, hide } = useShownPassword(resetState);
  // The most recent of the two actions decides the toast.
  const last = (toggleState.at ?? 0) > (resetState.at ?? 0) ? toggleState : resetState;

  const small = "h-9 px-3.5 text-sm";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {!isSelf && (
          <form action={toggle}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="disabled" value={disabled ? "false" : "true"} />
            <Button
              type="submit"
              variant="secondary"
              disabled={toggling}
              className={cn(small, !disabled && "text-danger hover:border-danger/50 hover:bg-danger/5")}
              aria-label={`${disabled ? "Enable" : "Disable"} ${name}`}
            >
              {toggling ? "Saving…" : disabled ? "Enable" : "Disable"}
            </Button>
          </form>
        )}
        {!isSelf &&
          (confirmingReset ? (
            <form
              action={(fd) => {
                setConfirmingReset(false);
                return reset(fd);
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="id" value={id} />
              <span className="text-sm text-mute">Their current password stops working.</span>
              <Button type="submit" disabled={resetting} className={small}>
                Reset password
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmingReset(false)} className="h-9 text-sm">
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={resetting}
              onClick={() => setConfirmingReset(true)}
              className={small}
              aria-label={`Reset password for ${name}`}
            >
              {resetting ? "Resetting…" : "Reset password"}
            </Button>
          ))}
        {isSelf && <span className="text-sm text-mute">Change your password under Account.</span>}
      </div>
      {shown && <TemporaryPassword key={resetState.at} password={shown} account={resetState.account} onDone={hide} />}
      <Toast message={last.error ?? last.message} stamp={last.at} tone={last.error ? "error" : "success"} />
    </div>
  );
}

const passwordInputs = [
  { name: "current", label: "Current password", autoComplete: "current-password" },
  { name: "next", label: "New password", autoComplete: "new-password" },
  { name: "confirm", label: "Confirm new password", autoComplete: "new-password" },
] as const;

export function ChangePasswordForm({ minLength }: { minLength: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(changeOwnPassword, {} as PasswordState);

  useEffect(() => {
    if (!state.at) return;
    if (state.ok) formRef.current?.reset();
    const first = passwordInputs.find((f) => state.fieldErrors?.[f.name]);
    if (first) document.getElementById(`pw-${first.name}`)?.focus();
  }, [state.at, state.ok, state.fieldErrors]);

  return (
    <form ref={formRef} action={action} noValidate className="space-y-5">
      {passwordInputs.map((f) => {
        const id = `pw-${f.name}`;
        const error = state.fieldErrors?.[f.name];
        const hint = f.name === "next" ? `At least ${minLength} characters. A short phrase is easier to remember.` : undefined;
        return (
          <Field key={f.name} id={id} label={f.label} required error={error} hint={hint}>
            <Input
              id={id}
              name={f.name}
              type="password"
              required
              minLength={f.name === "current" ? undefined : minLength}
              maxLength={200}
              autoComplete={f.autoComplete}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(id, error, hint)}
            />
          </Field>
        );
      })}
      <div className="flex flex-wrap items-center justify-end gap-4">
        {state.error && !state.fieldErrors && (
          <p className="mr-auto text-sm text-danger" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Change password"}
        </Button>
      </div>
      <Toast message={state.error ? undefined : state.message} stamp={state.at} />
    </form>
  );
}

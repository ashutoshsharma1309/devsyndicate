"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { login, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const ERROR_ID = "login-error";

/**
 * Admin sign-in: username + password. The primary admin uses their username; additional named
 * admins type their email address into the same field. `next` is where to go after signing in
 * (the action re-validates it). After a failed attempt the username is kept and the password
 * field is focused; the error is the same whichever credential was wrong.
 */
export function LoginForm({ disabled, next }: { disabled: boolean; next?: string }) {
  const [state, action, pending] = useActionState(login, {} as ActionState);
  const [showPassword, setShowPassword] = useState(false);
  const failed = Boolean(state.error);
  const describedBy = failed ? ERROR_ID : undefined;

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="username" label="Username" required>
        {/* Keyed on the attempt: React resets the form after the action, so remount with the typed value. */}
        <Input
          key={`u-${state.at ?? 0}`}
          id="username"
          name="username"
          type="text"
          defaultValue={state.username ?? ""}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={200}
          required
          autoFocus={!failed}
          disabled={disabled}
          aria-invalid={failed || undefined}
          aria-describedby={describedBy}
        />
      </Field>
      <Field id="password" label="Password" required>
        <div className="relative">
          <Input
            key={`p-${state.at ?? 0}`}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            maxLength={200}
            required
            autoFocus={failed}
            disabled={disabled}
            className="pr-12"
            aria-invalid={failed || undefined}
            aria-describedby={describedBy}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="password"
            aria-pressed={showPassword}
            disabled={disabled}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-sm text-mute transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal disabled:opacity-60"
          >
            {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
      </Field>

      {failed && (
        // Keyed so a repeated identical error is announced again.
        <p
          key={state.at}
          id={ERROR_ID}
          role="alert"
          className="flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/5 px-3.5 py-3 text-sm leading-snug text-danger"
        >
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          <span>{state.error}</span>
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending || disabled} aria-disabled={pending || disabled}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="sr-only" aria-live="polite">
        {pending ? "Signing in" : ""}
      </p>
    </form>
  );
}

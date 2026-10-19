import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * - 16px text below `sm`: iOS Safari zooms the page when a smaller control is focused.
 * - Border ink/47 is the lightest that keeps 3:1 against both the white fill (3.4:1) and
 *   the paper background (3.0:1); placeholder mute/85 is the lightest at 4.5:1 on white.
 */
const control =
  "block w-full rounded-sm border border-ink/47 bg-white px-3.5 text-base text-ink shadow-[0_1px_0_rgb(10_11_13/0.03)] transition-[border-color,box-shadow] duration-200 placeholder:text-mute/85 hover:border-ink/70 focus:border-signal focus:outline-none focus:ring-4 focus:ring-signal/12 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/12 disabled:opacity-60 sm:text-[0.9375rem]";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error, wired up with ids for aria-describedby. */
export function Field({ id, label, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-sm font-medium">
        <span>
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-0.5 text-signal">
              *
            </span>
          ) : null}
        </span>
        {!required && <span className="t-label font-normal text-mute">Optional</span>}
      </label>
      {children}
      <FieldMessage id={id} hint={hint} error={error} />
    </div>
  );
}

export function FieldMessage({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-danger">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-px size-3.5 shrink-0" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.5h1.5v4.75h-1.5V4.5zm0 6h1.5V12h-1.5v-1.5z" />
        </svg>
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="mt-2 text-[0.8125rem] leading-snug text-mute">
        {hint}
      </p>
    );
  }
  return null;
}

export const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-32 resize-y py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-empty={props.value === "" ? true : undefined}
        className={cn(control, "h-12 appearance-none pr-10 data-empty:text-mute [&>option]:text-ink", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-mute"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}

/** Radio group styled as selectable cards. */
export function ChoiceGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  hint,
  columns = "grid-cols-2 sm:grid-cols-3",
  required,
  optional,
}: {
  name: string;
  legend: string;
  options: readonly { value: string; label: string; hint?: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  columns?: string;
  required?: boolean;
  /** Shows the same "Optional" tag as Field. */
  optional?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <fieldset aria-describedby={describedBy(id, error, hint)}>
      <legend className="mb-2 flex w-full items-baseline justify-between gap-3 text-sm font-medium">
        <span>
          {legend}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-signal">
              *
            </span>
          )}
        </span>
        {optional && <span className="t-label font-normal text-mute">Optional</span>}
      </legend>
      {/* Not focusable: after a failed submit the form focuses the first radio inside. */}
      <div id={id} className={cn("grid gap-2", columns)}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                // Solid ring with an offset: the radio itself is visually hidden, so this is the only focus indicator.
                "relative flex cursor-pointer items-center gap-3 rounded-sm border bg-white px-3.5 py-3 text-[0.9375rem] transition-[border-color,background-color,box-shadow] duration-200 has-focus-visible:ring-2 has-focus-visible:ring-signal has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-paper",
                checked ? "border-signal bg-signal/4" : error ? "border-danger" : "border-ink/47 hover:border-ink/70",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                required={required}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
                  checked ? "border-signal" : "border-ink/47",
                )}
              >
                <span className={cn("size-2 rounded-full bg-signal transition-transform", checked ? "scale-100" : "scale-0")} />
              </span>
              <span className="flex flex-col leading-tight">
                <span>{o.label}</span>
                {o.hint && <span className="mt-0.5 text-[0.8125rem] text-mute">{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <FieldMessage id={id} hint={hint} error={error} />
    </fieldset>
  );
}

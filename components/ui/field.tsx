import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "block w-full rounded-sm border border-line bg-white px-3.5 text-[0.9375rem] text-ink shadow-[0_1px_0_rgb(10_11_13/0.03)] transition-[border-color,box-shadow] duration-200 placeholder:text-mute/60 hover:border-ink/30 focus:border-signal focus:outline-none focus:ring-4 focus:ring-signal/12 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/12 disabled:opacity-60";

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
        {!required && <span className="t-label text-mute">Optional</span>}
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
        className={cn(control, "h-12 appearance-none pr-10 invalid:text-mute/70 [&>option]:text-ink", className)}
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
  columns = "sm:grid-cols-3",
  required,
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
}) {
  const id = `f-${name}`;
  return (
    <fieldset aria-describedby={describedBy(id, error, hint)}>
      <legend className="mb-2 text-sm font-medium">
        {legend}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-signal">
            *
          </span>
        )}
      </legend>
      <div id={id} tabIndex={-1} className={cn("grid grid-cols-2 gap-2 outline-none", columns)}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 rounded-sm border bg-white px-3.5 py-3 text-[0.9375rem] transition-[border-color,background-color,box-shadow] duration-200 has-focus-visible:ring-4 has-focus-visible:ring-signal/15",
                checked ? "border-signal bg-signal/4" : error ? "border-danger/60 hover:border-danger" : "border-line hover:border-ink/30",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
                  checked ? "border-signal" : "border-ink/25",
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

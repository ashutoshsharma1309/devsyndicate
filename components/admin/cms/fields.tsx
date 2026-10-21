"use client";

import { ChevronDown, ChevronUp, CircleAlert, Minus, Plus, X } from "lucide-react";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AdminPanel } from "@/components/admin/shell/panel";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { LabelPrefix, useEditor, useFieldLabel } from "./context";
import { fieldId, join, type Path } from "./paths";

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** A titled block of the form (h2). Its title prefixes the labels inside it in summaries. */
export function EditorGroup({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const prefix = useContext(LabelPrefix);
  return (
    <AdminPanel id={id} title={title} description={description} className="scroll-mt-24">
      <LabelPrefix.Provider value={[...prefix, title]}>
        <div className="space-y-6">{children}</div>
      </LabelPrefix.Provider>
    </AdminPanel>
  );
}

/** A labelled cluster inside a group, e.g. "Primary button" (label + link). */
export function SubGroup({ title, hint, children, className }: { title: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  const prefix = useContext(LabelPrefix);
  return (
    <fieldset className={cn("min-w-0 rounded-sm border border-line p-4", className)}>
      <legend className="px-1.5 text-sm font-medium">{title}</legend>
      {hint && <p className="-mt-1 mb-3 text-[0.8125rem] leading-snug text-mute">{hint}</p>}
      <LabelPrefix.Provider value={[...prefix, title]}>
        <div className="space-y-4">{children}</div>
      </LabelPrefix.Provider>
    </fieldset>
  );
}

/** Two columns from `sm` up. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-[0.8125rem] leading-snug text-danger">
      <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" strokeWidth={2.25} />
      <span>
        <span className="sr-only">Error: </span>
        {children}
      </span>
    </p>
  );
}

const NO_MARKUP = "Use plain text: “<” and “>” aren't allowed.";

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

type TextFieldProps = {
  path: Path;
  label: string;
  /** The schema's maximum; the counter shows it and typing past it is flagged (the server rejects it). */
  max: number;
  optional?: boolean;
  /** Line breaks are kept (bios, confirmation message). */
  multiline?: boolean;
  /** A textarea for long single-line copy; Enter doesn't add a line break, since the site shows one paragraph. */
  long?: boolean;
  rows?: number;
  hint?: ReactNode;
  /** Recommended length (guidance only, never blocks). `offset` counts text added around the value, e.g. a title suffix. */
  guidance?: { min: number; max: number; offset?: number; what?: string };
  type?: "text" | "email" | "url" | "tel";
  inputMode?: "text" | "email" | "url" | "tel" | "numeric";
  placeholder?: string;
  /** Extra client-side check on the trimmed value (the server re-validates). */
  validate?: (value: string) => string | undefined;
  hideLabel?: boolean;
  mono?: boolean;
  className?: string;
};

export function TextField({
  path,
  label,
  max,
  optional = false,
  multiline = false,
  long = false,
  rows = 3,
  hint,
  guidance,
  type = "text",
  inputMode,
  placeholder,
  validate,
  hideLabel = false,
  mono = false,
  className,
}: TextFieldProps) {
  const ctx = useEditor();
  useFieldLabel(path, label);
  const id = fieldId(ctx.section, path);
  const raw = ctx.get(path);
  const value = typeof raw === "string" ? raw : "";
  const trimmed = value.trim();
  const [touched, setTouched] = useState(false);

  const localError = !touched
    ? undefined
    : !optional && trimmed === ""
      ? `${label} can't be empty.`
      : trimmed.length > max
        ? `Keep this under ${max} characters.`
        : /[<>]/.test(value)
          ? NO_MARKUP
          : trimmed
            ? validate?.(trimmed)
            : undefined;
  const error = ctx.error(path) ?? localError;

  const length = trimmed.length;
  const over = length > max;
  const describedBy = [error ? `${id}-error` : hint ? `${id}-hint` : null, `${id}-count`, guidance ? `${id}-guide` : null]
    .filter(Boolean)
    .join(" ");

  const common = {
    id,
    value,
    disabled: ctx.disabled,
    placeholder,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    onBlur: () => setTouched(true),
  } as const;

  let guide: ReactNode = null;
  if (guidance) {
    const total = length + (guidance.offset ?? 0);
    const verdict =
      length === 0 ? "" : total < guidance.min ? " — on the short side" : total > guidance.max ? " — on the long side" : " — good length";
    guide = (
      <p id={`${id}-guide`} className="text-[0.8125rem] leading-snug text-mute">
        Aim for {guidance.min}–{guidance.max} characters{guidance.what ? ` ${guidance.what}` : ""}. Now {total}
        {verdict}. Guidance only.
      </p>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <label
        htmlFor={id}
        className={cn("mb-1.5 flex items-baseline justify-between gap-3 text-sm font-medium", hideLabel && "sr-only")}
      >
        <span>{label}</span>
        {optional && <span className="t-label font-normal text-mute">Optional</span>}
      </label>
      {multiline || long ? (
        <Textarea
          {...common}
          rows={rows}
          className={cn("min-h-0", mono && "font-mono text-sm")}
          onChange={(e) => ctx.set(path, e.target.value)}
          onKeyDown={multiline ? undefined : (e) => e.key === "Enter" && e.preventDefault()}
        />
      ) : (
        <Input
          {...common}
          type={type}
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={type === "text" ? undefined : false}
          className={cn(mono && "font-mono text-sm")}
          onChange={(e) => ctx.set(path, e.target.value)}
        />
      )}
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {error ? (
            <ErrorText id={`${id}-error`}>{error}</ErrorText>
          ) : hint ? (
            <p id={`${id}-hint`} className="text-[0.8125rem] leading-snug text-mute">
              {hint}
            </p>
          ) : null}
          {guide}
        </div>
        <span id={`${id}-count`} className={cn("shrink-0 text-xs tabular-nums", over ? "font-medium text-danger" : "text-mute")}>
          {length}/{max}
          <span className="sr-only"> characters{over ? `, ${length - max} over the limit` : ""}</span>
          {over && <span aria-hidden="true"> · {length - max} over</span>}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------------

/** A checkbox row with a large hit area. */
export function BoolField({ path, label, hint }: { path: Path; label: string; hint?: ReactNode }) {
  const ctx = useEditor();
  useFieldLabel(path, label);
  const id = fieldId(ctx.section, path);
  const checked = ctx.get(path) === true;
  const error = ctx.error(path);
  return (
    <div>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border border-line bg-white px-3.5 py-3 transition-colors duration-150 hover:border-ink/30"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={ctx.disabled}
          onChange={(e) => ctx.set(path, e.target.checked)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="mt-0.5 size-4 shrink-0 accent-signal"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{label}</span>
          {hint && (
            <span id={`${id}-hint`} className="mt-0.5 block text-[0.8125rem] leading-snug text-mute">
              {hint}
            </span>
          )}
        </span>
      </label>
      {error && (
        <div className="mt-1.5">
          <ErrorText id={`${id}-error`}>{error}</ErrorText>
        </div>
      )}
    </div>
  );
}

export function SelectField({
  path,
  label,
  options,
  hint,
}: {
  path: Path;
  label: string;
  options: readonly { value: string; label: string }[];
  hint?: ReactNode;
}) {
  const ctx = useEditor();
  useFieldLabel(path, label);
  const id = fieldId(ctx.section, path);
  const value = String(ctx.get(path) ?? "");
  const error = ctx.error(path);
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="mb-1.5 text-sm font-medium">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        disabled={ctx.disabled}
        onChange={(e) => ctx.set(path, e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <div className="mt-1.5">
        {error ? (
          <ErrorText id={`${id}-error`}>{error}</ErrorText>
        ) : hint ? (
          <p id={`${id}-hint`} className="text-[0.8125rem] leading-snug text-mute">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** A subset of fixed options (stored in the options' order). */
export function CheckboxListField({
  path,
  label,
  options,
  hint,
}: {
  path: Path;
  label: string;
  options: readonly { value: string; label: string }[];
  hint?: ReactNode;
}) {
  const ctx = useEditor();
  useFieldLabel(path, label);
  const id = fieldId(ctx.section, path);
  const raw = ctx.get(path);
  const selected = new Set(Array.isArray(raw) ? (raw as string[]) : []);
  const error = ctx.error(path);
  const toggle = (v: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(v);
    else next.delete(v);
    ctx.set(
      path,
      options.map((o) => o.value).filter((x) => next.has(x)),
    );
  };
  return (
    <fieldset id={id} tabIndex={-1} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className="min-w-0">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-[0.8125rem] leading-snug text-mute">
          {hint}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-line bg-white px-3.5 py-2.5 text-sm transition-colors duration-150 hover:border-ink/30"
          >
            <input
              type="checkbox"
              checked={selected.has(o.value)}
              disabled={ctx.disabled}
              onChange={(e) => toggle(o.value, e.target.checked)}
              className="size-4 shrink-0 accent-signal"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <div className="mt-1.5">
          <ErrorText id={`${id}-error`}>{error}</ErrorText>
        </div>
      )}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

let keySeq = 0;
const newKey = () => `n${++keySeq}`;

const iconButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-mute transition-colors duration-150 hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-35";

type ListEditorProps<T> = {
  path: Path;
  /** The list's name, e.g. "Questions". */
  label: string;
  /** One item, e.g. "Question". */
  itemLabel: string;
  min?: number;
  max?: number;
  /** A blank item. Leave out for a fixed set that can only be reordered. */
  newItem?: () => T;
  /** Header text for an item, e.g. its question. */
  summary?: (item: T, index: number) => string;
  /** Extra header content, e.g. a "Hidden" tag. */
  badge?: (item: T, index: number) => ReactNode;
  renderItem: (itemPath: Path, index: number, item: T) => ReactNode;
  hint?: ReactNode;
  /** One control per row (lists of short strings). */
  compact?: boolean;
  /** Buttons next to "Add", e.g. "Renumber". */
  toolbar?: ReactNode;
};

/**
 * Add, remove and reorder items with buttons (no drag), keyboard accessible.
 * Moves and removals are announced and keep focus on the item being moved.
 */
export function ListEditor<T>({
  path,
  label,
  itemLabel,
  min = 0,
  max = Infinity,
  newItem,
  summary,
  badge,
  renderItem,
  hint,
  compact = false,
  toolbar,
}: ListEditorProps<T>) {
  const ctx = useEditor();
  const prefix = useContext(LabelPrefix);
  useFieldLabel(path, label);
  const id = fieldId(ctx.section, path);
  const raw = ctx.get(path);
  const items = (Array.isArray(raw) ? raw : []) as T[];
  const listError = ctx.error(path);
  const noun = itemLabel.toLowerCase();

  // Stable React keys alongside the items, so reordering moves (not re-creates) the fields.
  const [keys, setKeys] = useState<string[]>(() => items.map((_, i) => `i${i}`));
  let effectiveKeys = keys;
  if (keys.length !== items.length) {
    effectiveKeys =
      items.length > keys.length ? [...keys, ...items.slice(keys.length).map(() => newKey())] : keys.slice(0, items.length);
    setKeys(effectiveKeys);
  }

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [announcement, setAnnouncement] = useState("");
  /** Where focus goes after the render that applies a move, removal or addition. */
  const pendingFocus = useRef<{ key: string | null; target: string } | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const addRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const want = pendingFocus.current;
    if (!want) return;
    pendingFocus.current = null;
    const li = want.key ? itemRefs.current.get(want.key) : null;
    let el: HTMLElement | null = null;
    if (li) {
      el =
        want.target === "field"
          ? li.querySelector<HTMLElement>("input, textarea, select")
          : [want.target, want.target === "up" ? "down" : "up", "toggle"]
              .map((a) => li.querySelector<HTMLElement>(`[data-action="${a}"]:not(:disabled)`))
              .find(Boolean) ?? null;
    }
    (el ?? addRef.current)?.focus();
  });

  const canAddRemove = Boolean(newItem);
  const atMax = items.length >= max;
  const atMin = items.length <= min;

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    const nextKeys = effectiveKeys.slice();
    const [k] = nextKeys.splice(from, 1);
    nextKeys.splice(to, 0, k);
    setKeys(nextKeys);
    ctx.set(path, next);
    setAnnouncement(`${itemLabel} moved to position ${to + 1} of ${items.length}.`);
    pendingFocus.current = { key: k, target: to < from ? "up" : "down" };
  }

  function remove(index: number) {
    const next = items.slice();
    next.splice(index, 1);
    const nextKeys = effectiveKeys.slice();
    nextKeys.splice(index, 1);
    setKeys(nextKeys);
    ctx.set(path, next);
    setAnnouncement(`${itemLabel} ${index + 1} removed. ${next.length} left.`);
    pendingFocus.current = { key: nextKeys[index] ?? nextKeys[index - 1] ?? null, target: "remove" };
  }

  function add() {
    if (!newItem || atMax) return;
    const k = newKey();
    setKeys([...effectiveKeys, k]);
    ctx.set(path, [...items, newItem()]);
    setAnnouncement(`${itemLabel} ${items.length + 1} added.`);
    pendingFocus.current = { key: k, target: "field" };
  }

  function toggle(k: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  const countText = `${items.length} ${items.length === 1 ? noun : `${noun}s`}`;
  const limitText =
    canAddRemove && Number.isFinite(max) ? (min > 0 ? `${min}–${max} allowed` : `Up to ${max}`) : null;

  return (
    <fieldset id={id} tabIndex={-1} className="min-w-0 focus:outline-none">
      <legend className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm font-medium">
        <span>{label}</span>
        <span className="text-xs font-normal tabular-nums text-mute">
          {countText}
          {limitText && ` · ${limitText}`}
        </span>
      </legend>
      {hint && <p className="mt-1 text-[0.8125rem] leading-snug text-mute">{hint}</p>}
      {listError && (
        <div className="mt-2">
          <ErrorText id={`${id}-error`}>{listError}</ErrorText>
        </div>
      )}

      <ol className={cn("mt-3", compact ? "space-y-2" : "space-y-3")}>
        {items.map((item, i) => {
          const k = effectiveKeys[i];
          const itemPath = join(path, i);
          const name = `${itemLabel} ${i + 1}`;
          const title = summary?.(item, i)?.trim();
          const forcedOpen = ctx.hasErrorWithin(itemPath);
          const open = compact || forcedOpen || !collapsed.has(k);
          const bodyId = `${id}-item-${k}`;
          const controls = (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                data-action="up"
                className={iconButton}
                disabled={ctx.disabled || i === 0}
                onClick={() => move(i, i - 1)}
                aria-label={`Move ${noun} ${i + 1} up`}
                title="Move up"
              >
                <ChevronUp aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                data-action="down"
                className={iconButton}
                disabled={ctx.disabled || i === items.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label={`Move ${noun} ${i + 1} down`}
                title="Move down"
              >
                <ChevronDown aria-hidden="true" className="size-4" />
              </button>
              {canAddRemove && (
                <button
                  type="button"
                  data-action="remove"
                  className={cn(iconButton, "hover:bg-danger/5 hover:text-danger")}
                  disabled={ctx.disabled || atMin}
                  onClick={() => remove(i)}
                  aria-label={`Remove ${noun} ${i + 1}`}
                  title={atMin ? `Keep at least ${min}` : "Remove"}
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              )}
            </div>
          );

          return (
            <li
              key={k}
              ref={(el) => {
                if (el) itemRefs.current.set(k, el);
                else itemRefs.current.delete(k);
              }}
              className={cn("min-w-0 rounded-sm border bg-white", forcedOpen ? "border-danger/40" : "border-line")}
            >
              <LabelPrefix.Provider value={[...prefix, name]}>
                {compact ? (
                  <div className="flex items-start gap-2 p-2">
                    <span aria-hidden="true" className="t-label mt-4 w-5 shrink-0 text-right tabular-nums text-mute">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">{renderItem(itemPath, i, item)}</div>
                    <div className="mt-2">{controls}</div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 py-1 pl-1.5 pr-1.5">
                      <button
                        type="button"
                        data-action="toggle"
                        onClick={() => toggle(k)}
                        aria-expanded={open}
                        aria-controls={bodyId}
                        disabled={forcedOpen}
                        className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-sm px-1.5 text-left hover:bg-ink/[0.03]"
                      >
                        <span aria-hidden="true" className="t-label w-5 shrink-0 tabular-nums text-mute">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          <span className="sr-only">{name}: </span>
                          {title || <span className="font-normal text-mute">{name} (empty)</span>}
                        </span>
                        {badge?.(item, i)}
                        {open ? (
                          <Minus aria-hidden="true" className="size-3.5 shrink-0 text-mute" />
                        ) : (
                          <Plus aria-hidden="true" className="size-3.5 shrink-0 text-mute" />
                        )}
                        <span className="sr-only">{open ? "(collapse)" : "(expand)"}</span>
                      </button>
                      {controls}
                    </div>
                    <div id={bodyId} hidden={!open} className="space-y-4 border-t border-line p-4">
                      {open && renderItem(itemPath, i, item)}
                    </div>
                  </>
                )}
              </LabelPrefix.Provider>
            </li>
          );
        })}
      </ol>

      {(canAddRemove || toolbar) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {canAddRemove && (
            <Button
              ref={addRef}
              type="button"
              variant="secondary"
              className="h-9 px-3.5 text-sm"
              disabled={ctx.disabled || atMax}
              onClick={add}
            >
              <Plus aria-hidden="true" className="size-4" />
              Add {noun}
            </Button>
          )}
          {toolbar}
          {canAddRemove && atMax && <span className="text-xs text-mute">Limit reached ({max}).</span>}
        </div>
      )}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  );
}

/** A reorderable list of short strings (trust points, deliverables). */
export function StringListField({
  path,
  label,
  itemLabel,
  max,
  min = 1,
  maxItems,
  hint,
}: {
  path: Path;
  label: string;
  itemLabel: string;
  /** Characters per item. */
  max: number;
  min?: number;
  maxItems: number;
  hint?: ReactNode;
}) {
  return (
    <ListEditor<string>
      path={path}
      label={label}
      itemLabel={itemLabel}
      min={min}
      max={maxItems}
      hint={hint}
      compact
      newItem={() => ""}
      renderItem={(p, i) => <TextField path={p} label={`${itemLabel} ${i + 1}`} max={max} hideLabel />}
    />
  );
}

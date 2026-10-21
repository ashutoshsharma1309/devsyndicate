"use client";

import { CircleAlert, CircleDot, ExternalLink, History, RotateCcw, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import {
  discardDraft,
  publish,
  resetToDefaults,
  revertToRevision,
  saveDraft,
  type ContentActionResult,
} from "@/app/admin/content-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Toast } from "@/components/ui/toast";
import { sameContent } from "@/lib/cms/merge";
import { contentFieldErrors, schemas, type SectionContent, type SectionKey } from "@/lib/cms/schema";
import { PAGE_LABELS } from "@/lib/cms/sections";
import { cn } from "@/lib/utils";
import { EditorContext, type EditorContextValue } from "./context";
import { Dialog } from "./dialog";
import { formatStamp, publishStatus, stampLine } from "./format";
import { changedPaths, fieldId, getAt, labelFor, setAt, type Path } from "./paths";
import { ContentStatusBadge } from "./status";
import type { EditorData, EditorInitial, PublishCheck, RevisionItem } from "./types";
import { useUnsavedChangesGuard } from "./unsaved-guard";

type Busy = null | "save" | "publish" | "discard" | "reset" | "revert";
type DialogState = null | { kind: "publish" } | { kind: "discard" } | { kind: "reset" } | { kind: "revert"; revision: RevisionItem };
type ToastState = { message: string; tone: "success" | "error"; stamp: number } | null;
/** After an action, adopt the server's state when it arrives: "soft" keeps the form mounted, "hard" remounts it. */
type Sync = null | "soft" | "hard";

const versionOf = (s: EditorInitial) => `${s.draftSavedAt ?? ""}|${s.publishedAt ?? ""}|${s.hasDraft}`;

const pageLabel = (path: string) => (PAGE_LABELS as Record<string, string>)[path] ?? path;

function listText(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export type SectionEditorProps<K extends SectionKey> = EditorData<K> & {
  children: ReactNode;
  /** Extra warnings, blocking errors or a password prompt for the publish dialog. */
  publishChecks?: (value: SectionContent<K>, live: SectionContent<K>) => PublishCheck[];
};

/**
 * One section's editor: holds the content being edited, and the Save draft /
 * Preview / Publish / Discard / Reset / Restore actions around the fields
 * passed as children (which read and write through EditorContext).
 */
export function SectionEditor<K extends SectionKey>({
  initial,
  revisions,
  revisionsError,
  children,
  publishChecks,
}: SectionEditorProps<K>) {
  const key = initial.key;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  // Field labels, registered by the fields themselves (for the publish summary and the error list).
  const [labels] = useState(() => new Map<Path, string>());

  const [base, setBase] = useState(initial);
  const [value, setValue] = useState<SectionContent<K>>(initial.current);
  /** What the store holds for the editor (draft ?? live): unsaved = value differs from this. */
  const [saved, setSaved] = useState<SectionContent<K>>(initial.current);
  const [submitted, setSubmitted] = useState<SectionContent<K> | null>(null);
  const [generation, setGeneration] = useState(0);
  const [sync, setSync] = useState<Sync>(null);
  const [stale, setStale] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Busy>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [previewPath, setPreviewPath] = useState(initial.publicPaths[0] ?? "/");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [acknowledged, setAcknowledged] = useState(false);

  const dirty = useMemo(() => !sameContent(value, saved), [value, saved]);

  // New server state (after an action, or someone else's change). Adjusting state during render, as React recommends.
  if (initial !== base) {
    setBase(initial);
    if (versionOf(initial) !== versionOf(base)) {
      if (sync || !dirty) {
        // Keep anything typed since the action was sent; otherwise take the server's (normalised) copy.
        const typedSince = sync === "soft" && submitted !== null && !sameContent(value, submitted);
        if (!typedSince) setValue(initial.current);
        setSaved(initial.current);
        if (sync === "hard") setGeneration((g) => g + 1);
        setSync(null);
        setSubmitted(null);
        setStale(false);
      } else {
        setStale(true);
      }
    }
  }

  useUnsavedChangesGuard(dirty, rootRef);

  const notify = (message: string, tone: "success" | "error" = "success") => setToast({ message, tone, stamp: Date.now() });
  const refresh = () => startTransition(() => router.refresh());

  // ---- field access -------------------------------------------------------

  const set = useCallback((path: Path, v: unknown) => {
    setValue((prev) => setAt(prev, path, v));
    setErrors((prev) => {
      const keys = Object.keys(prev);
      const hit = keys.filter((k) => k === path || k.startsWith(`${path}.`) || (k !== "" && path.startsWith(`${k}.`)));
      if (hit.length === 0) return prev;
      const next = { ...prev };
      for (const k of hit) delete next[k];
      return next;
    });
  }, []);

  const registerLabel = useCallback((path: Path, label: string) => {
    labels.set(path, label);
  }, [labels]);

  const ctx: EditorContextValue = useMemo(
    () => ({
      section: key,
      get: (path) => getAt(value, path),
      set,
      error: (path) => errors[path],
      hasErrorWithin: (path) => Object.keys(errors).some((k) => k === path || k.startsWith(`${path}.`)),
      registerLabel,
      disabled: initial.storeKind === null,
    }),
    [key, value, set, errors, registerLabel, initial.storeKind],
  );

  // ---- validation ---------------------------------------------------------

  function showErrors(fieldErrors: Record<string, string>, message = "Some fields need attention.") {
    setErrors(fieldErrors);
    notify(message, "error");
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  /** The same strict check the server runs, so errors show without a round trip. */
  function validateHere(): boolean {
    const parsed = schemas[key].safeParse(value);
    if (parsed.success) return true;
    const fe = contentFieldErrors(parsed.error.issues);
    const n = Object.keys(fe).length;
    showErrors(fe, `${n} ${n === 1 ? "field needs" : "fields need"} attention before this can be saved.`);
    return false;
  }

  function failed(res: ContentActionResult) {
    if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) showErrors(res.fieldErrors, res.error);
    else notify(res.error ?? "Something went wrong. Nothing was changed.", "error");
  }

  // ---- actions ------------------------------------------------------------

  async function save(quiet = false): Promise<boolean> {
    if (!validateHere()) return false;
    setBusy("save");
    const snapshot = value;
    let res: ContentActionResult;
    try {
      res = await saveDraft(key, snapshot);
    } catch {
      res = { ok: false, error: "Couldn't reach the server. Your edits are still here; try again." };
    }
    setBusy(null);
    if (!res.ok) {
      failed(res);
      return false;
    }
    setErrors({});
    setSaved(snapshot);
    setSubmitted(snapshot);
    setSync("soft");
    if (!quiet) notify(`Draft saved${res.savedAt ? ` at ${formatStamp(res.savedAt).split(", ").pop()}` : ""}. The website hasn't changed.`);
    refresh();
    return true;
  }

  async function openPreview(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!dirty) return; // the link opens the preview of the saved draft as is
    e.preventDefault();
    const url = e.currentTarget.href;
    // Open the tab now, while the click still counts as a user gesture, then point it at the preview.
    const tab = window.open("", "_blank");
    const ok = await save(true);
    if (!ok) {
      tab?.close();
      return;
    }
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
      notify("Draft saved and opened in a new tab.");
    } else {
      notify("Draft saved. Your browser blocked the new tab; use Preview again.");
    }
  }

  function startPublish() {
    if (!validateHere()) return;
    setPassword("");
    setPasswordError(undefined);
    setAcknowledged(false);
    setDialog({ kind: "publish" });
  }

  async function confirmPublish(needsPassword: boolean) {
    if (needsPassword && !password) {
      setPasswordError("Enter your current password.");
      return;
    }
    setBusy("publish");
    const snapshot = value;
    let res: ContentActionResult;
    try {
      res = await publish(key, snapshot, needsPassword ? { currentPassword: password } : undefined);
    } catch {
      res = { ok: false, error: "Couldn't reach the server. Nothing was published; try again." };
    }
    setBusy(null);
    if (!res.ok) {
      if (res.fieldErrors?.currentPassword) {
        setPasswordError(res.fieldErrors.currentPassword);
        return;
      }
      if (!res.fieldErrors && res.error && /password/i.test(res.error)) {
        setPasswordError(res.error);
        return;
      }
      setDialog(null);
      failed(res);
      return;
    }
    setPassword("");
    setDialog(null);
    setErrors({});
    setSaved(snapshot);
    setSubmitted(snapshot);
    setSync("soft");
    notify(`Published. The website now shows the new ${initial.label.toLowerCase()} content.`);
    refresh();
  }

  async function run(kind: Exclude<Busy, null | "save" | "publish">, action: () => Promise<ContentActionResult>, success: string) {
    setBusy(kind);
    let res: ContentActionResult;
    try {
      res = await action();
    } catch {
      res = { ok: false, error: "Couldn't reach the server. Nothing was changed; try again." };
    }
    setBusy(null);
    setDialog(null);
    if (!res.ok) {
      failed(res);
      return;
    }
    setErrors({});
    setSync("hard");
    setSubmitted(null);
    notify(success);
    refresh();
  }

  function undoEdits() {
    setValue(saved);
    setErrors({});
    setGeneration((g) => g + 1);
    setDialog(null);
    notify(base.hasDraft ? "Unsaved edits undone. The saved draft is back." : "Unsaved edits undone.");
  }

  function loadLatest() {
    setValue(base.current);
    setSaved(base.current);
    setErrors({});
    setStale(false);
    setGeneration((g) => g + 1);
  }

  // ---- derived ------------------------------------------------------------

  const status = publishStatus({ publishedAt: base.publishedAt, hasUnpublishedChanges: base.hasUnpublishedChanges || dirty });
  const publishedLine = stampLine("Published", base.publishedAt, base.publishedBy);
  const draftLine = base.hasDraft ? stampLine("Draft saved", base.draftSavedAt, base.draftSavedBy) : null;
  const previewHref = `/admin/content/preview?path=${encodeURIComponent(previewPath)}`;
  const storeMissing = initial.storeKind === null;
  const working = busy !== null;
  const errorEntries = Object.entries(errors).filter(([k]) => k !== "currentPassword");

  const changes = useMemo(() => {
    if (dialog?.kind !== "publish") return [];
    const seen = new Set<string>();
    for (const p of changedPaths(base.live, value)) seen.add(labelFor(p, labels));
    return [...seen];
  }, [dialog, base.live, value, labels]);
  const checks = dialog?.kind === "publish" ? (publishChecks?.(value, base.live as SectionContent<K>) ?? []) : [];
  const blocking = checks.filter((c) => c.kind === "error");
  const warnings = checks.filter((c) => c.kind === "warning");
  const passwordCheck = checks.find((c) => c.kind === "password");
  const pages = listText(base.publicPaths.map(pageLabel));

  const barStatus = dirty ? "Unsaved changes" : base.hasDraft && base.hasUnpublishedChanges ? "Draft saved — not live yet" : "No unsaved changes";

  return (
    <div ref={rootRef} className="min-w-0">
      {/* ---- status --------------------------------------------------- */}
      <section aria-label="Publishing status" className="rounded-md border border-line bg-white">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-5 py-4">
          <div className="min-w-0 space-y-1.5">
            <ContentStatusBadge status={status} />
            <p className="text-sm text-mute">
              {publishedLine ?? "Not published yet: the website shows its original copy."}
              {draftLine && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="block sm:inline">{draftLine}</span>
                </>
              )}
            </p>
            <p className="text-sm text-mute">
              Shows on {pages}
              {base.siteWide ? ", and in parts of every page (such as the footer)" : ""}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-3 text-sm"
              disabled={working || storeMissing || (!dirty && !base.hasDraft)}
              onClick={() => setDialog({ kind: "discard" })}
            >
              <Undo2 aria-hidden="true" className="size-4" />
              Discard changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 px-3 text-sm"
              disabled={working || storeMissing}
              onClick={() => setDialog({ kind: "reset" })}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Reset to website defaults
            </Button>
          </div>
        </div>

        <details className="group border-t border-line">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-5 text-sm font-medium hover:bg-paper/60 [&::-webkit-details-marker]:hidden">
            <History aria-hidden="true" className="size-4 text-mute" />
            Version history
            <span className="font-normal text-mute">({revisions.length})</span>
            <span aria-hidden="true" className="ml-auto text-mute transition-transform duration-150 group-open:rotate-90">
              ›
            </span>
          </summary>
          <div className="border-t border-line px-5 py-3">
            {revisionsError ? (
              <p className="text-sm text-danger">{revisionsError}</p>
            ) : revisions.length === 0 ? (
              <p className="text-sm text-mute">No published versions yet. Each publish is kept here (the last 20).</p>
            ) : (
              <>
                <p className="mb-2 text-[0.8125rem] text-mute">
                  Restoring copies a version into the draft. Nothing changes on the website until you publish it.
                </p>
                <ol className="divide-y divide-line">
                  {revisions.map((r, i) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5 text-sm">
                      <span className="min-w-0">
                        <time dateTime={r.publishedAt} className="tabular-nums">
                          {formatStamp(r.publishedAt)}
                        </time>
                        <span className="text-mute"> by {r.publishedBy || "unknown"}</span>
                        {i === 0 && base.hasPublished && (
                          <span className="ml-2 inline-flex items-center rounded-xs border border-success/30 bg-success/10 px-1.5 text-xs font-medium text-success">
                            Live
                          </span>
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-3 text-sm"
                        disabled={working || storeMissing}
                        onClick={() => setDialog({ kind: "revert", revision: r })}
                      >
                        Restore as draft
                        <span className="sr-only"> (version published {formatStamp(r.publishedAt)})</span>
                      </Button>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </details>
      </section>

      {storeMissing && (
        <p role="alert" className="mt-4 rounded-md border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          Content storage isn&apos;t configured on this server, so changes can&apos;t be saved or published. Set{" "}
          <code className="font-mono">DATABASE_URL</code> and run <code className="font-mono">npm run db:setup</code>.
        </p>
      )}

      {stale && (
        <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-signal/25 bg-signal/[0.05] px-4 py-3 text-sm">
          <p className="min-w-0">
            This section was saved or published elsewhere since you started editing
            {base.draftSavedBy || base.publishedBy ? ` (${draftLine ?? publishedLine})` : ""}. Saving now replaces that version.
          </p>
          <Button type="button" variant="secondary" className="h-9 px-3 text-sm" onClick={loadLatest}>
            Load the latest version
          </Button>
        </div>
      )}

      {/* ---- errors --------------------------------------------------- */}
      <div ref={summaryRef} tabIndex={-1} role="alert" className="focus:outline-none">
        {errorEntries.length > 0 && (
          <div className="mt-4 rounded-md border border-danger/30 bg-danger/[0.04] px-4 py-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-danger">
              <CircleAlert aria-hidden="true" className="size-4" />
              {errorEntries.length === 1 ? "1 field needs attention" : `${errorEntries.length} fields need attention`}
            </p>
            <ul className="mt-2 space-y-1">
              {errorEntries.slice(0, 12).map(([path, message]) => (
                <li key={path}>
                  {path === "" ? (
                    <span>{message}</span>
                  ) : (
                    <a
                      href={`#${fieldId(key, path)}`}
                      className="underline underline-offset-4 hover:text-danger"
                      onClick={(e) => {
                        const el = document.getElementById(fieldId(key, path));
                        if (!el) return;
                        e.preventDefault();
                        el.scrollIntoView({ block: "center" });
                        el.focus({ preventScroll: true });
                      }}
                    >
                      {labelFor(path, labels)}
                    </a>
                  )}
                  {path !== "" && <span className="text-mute">: {message}</span>}
                </li>
              ))}
              {errorEntries.length > 12 && <li className="text-mute">…and {errorEntries.length - 12} more.</li>}
            </ul>
          </div>
        )}
      </div>

      {/* ---- fields --------------------------------------------------- */}
      <p className="mt-6 text-[0.8125rem] text-mute">
        Plain text only. Every field is required unless it&apos;s marked Optional.
      </p>
      <EditorContext.Provider value={ctx}>
        <form
          key={generation}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="mt-3 space-y-6"
        >
          {children}
          {/* Enter in a single-line field saves a draft. */}
          <button type="submit" hidden tabIndex={-1} aria-hidden="true" />
        </form>
      </EditorContext.Provider>

      {/* ---- action bar ----------------------------------------------- */}
      <div className="sticky bottom-2 z-30 mt-8 rounded-md border border-line bg-white px-3 py-2.5 shadow-[0_10px_30px_-12px_rgb(10_11_13/0.25)] sm:bottom-3 sm:px-4 sm:py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p role="status" className="mr-auto flex min-w-0 items-center gap-2 text-[0.8125rem] sm:text-sm">
            {dirty ? (
              <CircleDot aria-hidden="true" className="size-4 shrink-0 text-signal" />
            ) : (
              <span aria-hidden="true" className="size-4 shrink-0" />
            )}
            <span className={dirty ? "font-medium" : "text-mute"}>{busy ? workingText(busy) : barStatus}</span>
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="h-10 shrink-0 px-3 text-sm sm:px-4"
              disabled={working || storeMissing || !dirty}
              onClick={() => void save()}
            >
              {busy === "save" ? (
                "Saving…"
              ) : (
                <span>
                  Save<span className="hidden sm:inline"> draft</span>
                </span>
              )}
            </Button>
            <div className="flex min-w-0 flex-1 items-stretch sm:flex-none">
              {base.publicPaths.length > 1 && (
                <>
                  <label htmlFor={`${key}-preview-path`} className="sr-only">
                    Page to preview
                  </label>
                  <select
                    id={`${key}-preview-path`}
                    value={previewPath}
                    onChange={(e) => setPreviewPath(e.target.value)}
                    className="h-10 w-full min-w-0 rounded-l-sm sm:w-auto sm:max-w-36 border border-r-0 border-ink/15 bg-white pl-2.5 pr-1 text-sm text-ink focus:border-signal focus:outline-none focus:ring-4 focus:ring-signal/12"
                  >
                    {base.publicPaths.map((p) => (
                      <option key={p} value={p}>
                        {pageLabel(p)}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <a
                href={previewHref}
                target="_blank"
                rel="noopener"
                aria-disabled={working || storeMissing ? true : undefined}
                onClick={(e) => {
                  if (working || storeMissing) {
                    e.preventDefault();
                    return;
                  }
                  void openPreview(e);
                }}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-1.5 border border-ink/15 bg-transparent px-3 text-sm sm:px-3.5 font-medium transition-colors duration-150 hover:border-ink/40 hover:bg-ink/[0.03]",
                  base.publicPaths.length > 1 ? "rounded-r-sm" : "rounded-sm",
                  (working || storeMissing) && "pointer-events-none opacity-60",
                )}
              >
                Preview
                <ExternalLink aria-hidden="true" className="hidden size-3.5 sm:block" />
                <span className="sr-only">
                  {" "}
                  {pageLabel(previewPath)} in a new tab{dirty ? " (saves a draft first)" : ""}
                </span>
              </a>
            </div>
            <Button type="button" className="h-10 shrink-0 px-3 text-sm sm:px-4" disabled={working || storeMissing} onClick={startPublish}>
              {busy === "publish" ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      {/* ---- dialogs -------------------------------------------------- */}
      <Dialog
        open={dialog?.kind === "publish"}
        onClose={() => setDialog(null)}
        busy={busy === "publish"}
        title={`Publish ${initial.label.toLowerCase()}?`}
        footer={
          <>
            <Button type="button" variant="secondary" className="h-10 px-4 text-sm" disabled={busy === "publish"} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              data-autofocus={passwordCheck ? undefined : true}
              className="h-10 px-4 text-sm"
              disabled={busy === "publish" || blocking.length > 0 || (warnings.length > 0 && !acknowledged)}
              onClick={() => void confirmPublish(Boolean(passwordCheck))}
            >
              {busy === "publish" ? "Publishing…" : "Publish now"}
            </Button>
          </>
        }
      >
        <p>
          These pages update as soon as you publish: <strong className="font-medium">{pages}</strong>
          {base.siteWide ? ". Parts of this section appear on every page, so the whole site is refreshed." : "."}
        </p>
        <div className="mt-4">
          <h3 className="t-label text-mute">
            {changes.length > 0 ? `What changes (${changes.length})` : "What changes"}
          </h3>
          {changes.length === 0 ? (
            <p className="mt-1.5 text-mute">Nothing differs from the live version. Publishing records it as a new version.</p>
          ) : (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              {changes.slice(0, 12).map((c) => (
                <li key={c} className="break-words">
                  {c}
                </li>
              ))}
              {changes.length > 12 && <li className="list-none text-mute">…and {changes.length - 12} more</li>}
            </ul>
          )}
        </div>

        {blocking.length > 0 && (
          <div role="alert" className="mt-4 rounded-sm border border-danger/30 bg-danger/[0.04] p-3 text-danger">
            <p className="font-medium">This can&apos;t be published yet</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {blocking.map((c) => (
                <li key={c.message}>{c.message}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-4 rounded-sm border border-amber-600/30 bg-amber-500/10 p-3 text-amber-950">
            <p className="flex items-center gap-2 font-medium">
              <CircleAlert aria-hidden="true" className="size-4" />
              Check before publishing
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {warnings.map((c) => (
                <li key={c.message}>{c.message}</li>
              ))}
            </ul>
            <label className="mt-3 flex min-h-6 cursor-pointer items-start gap-2.5 font-medium">
              <input
                type="checkbox"
                data-autofocus={passwordCheck ? undefined : true}
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-signal"
              />
              I&apos;ve checked these details and want to publish them.
            </label>
          </div>
        )}

        {passwordCheck && (
          <div className="mt-4">
            <label htmlFor={`${key}-current-password`} className="mb-1.5 block text-sm font-medium">
              Your current password
            </label>
            <p id={`${key}-current-password-hint`} className="mb-2 text-[0.8125rem] text-mute">
              {passwordCheck.message}
            </p>
            <Input
              id={`${key}-current-password`}
              type="password"
              autoComplete="current-password"
              data-autofocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!(blocking.length > 0 || (warnings.length > 0 && !acknowledged))) void confirmPublish(true);
                }
              }}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={`${key}-current-password-hint${passwordError ? ` ${key}-current-password-error` : ""}`}
            />
            {passwordError && (
              <p id={`${key}-current-password-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] text-danger">
                <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                {passwordError}
              </p>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={dialog?.kind === "discard"}
        onClose={() => setDialog(null)}
        busy={busy === "discard"}
        tone="danger"
        title="Discard changes?"
        footer={
          <>
            <Button type="button" variant="secondary" className="h-10 px-4 text-sm" data-autofocus disabled={busy === "discard"} onClick={() => setDialog(null)}>
              Keep editing
            </Button>
            {dirty && base.hasDraft && (
              <Button type="button" variant="secondary" className="h-10 px-4 text-sm" disabled={busy === "discard"} onClick={undoEdits}>
                Undo unsaved edits only
              </Button>
            )}
            {base.hasDraft ? (
              <DangerButton
                disabled={busy === "discard"}
                onClick={() =>
                  void run("discard", () => discardDraft(key), "Draft discarded. The editor shows the live version again.")
                }
              >
                {busy === "discard" ? "Discarding…" : "Discard the draft"}
              </DangerButton>
            ) : (
              <DangerButton onClick={undoEdits}>Undo unsaved edits</DangerButton>
            )}
          </>
        }
      >
        {base.hasDraft ? (
          <>
            <p>
              Discarding deletes the saved draft{draftLine ? ` (${draftLine.replace(/^Draft saved/, "saved")})` : ""}
              {dirty ? " and your unsaved edits" : ""}. The editor goes back to what the website shows now.
            </p>
            <p className="mt-2 text-mute">The live website doesn&apos;t change.</p>
          </>
        ) : (
          <p>Your unsaved edits are thrown away and the editor goes back to what the website shows now.</p>
        )}
      </Dialog>

      <Dialog
        open={dialog?.kind === "reset"}
        onClose={() => setDialog(null)}
        busy={busy === "reset"}
        title="Reset to the website defaults?"
        footer={
          <>
            <Button type="button" variant="secondary" className="h-10 px-4 text-sm" data-autofocus disabled={busy === "reset"} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 px-4 text-sm"
              disabled={busy === "reset"}
              onClick={() =>
                void run(
                  "reset",
                  () => resetToDefaults(key),
                  "Original website copy loaded as a draft. Review it, then publish to put it live.",
                )
              }
            >
              {busy === "reset" ? "Resetting…" : "Load defaults as a draft"}
            </Button>
          </>
        }
      >
        <p>
          The original website copy for this section replaces the draft{dirty ? ", including your unsaved edits" : ""}. The
          live website doesn&apos;t change until you publish.
        </p>
      </Dialog>

      <Dialog
        open={dialog?.kind === "revert"}
        onClose={() => setDialog(null)}
        busy={busy === "revert"}
        title="Restore this version as a draft?"
        footer={
          <>
            <Button type="button" variant="secondary" className="h-10 px-4 text-sm" data-autofocus disabled={busy === "revert"} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 px-4 text-sm"
              disabled={busy === "revert"}
              onClick={() => {
                if (dialog?.kind !== "revert") return;
                const r = dialog.revision;
                void run(
                  "revert",
                  () => revertToRevision(key, r.id),
                  `Version from ${formatStamp(r.publishedAt)} loaded as a draft. Publish to put it live.`,
                );
              }}
            >
              {busy === "revert" ? "Restoring…" : "Restore as draft"}
            </Button>
          </>
        }
      >
        {dialog?.kind === "revert" && (
          <p>
            The version published {formatStamp(dialog.revision.publishedAt)}
            {dialog.revision.publishedBy ? ` by ${dialog.revision.publishedBy}` : ""} replaces the draft
            {dirty ? ", including your unsaved edits" : ""}. The live website doesn&apos;t change until you publish.
          </p>
        )}
      </Dialog>

      <Toast message={toast?.message} stamp={toast?.stamp} tone={toast?.tone} />
    </div>
  );
}

function workingText(b: Exclude<Busy, null>): string {
  return { save: "Saving draft…", publish: "Publishing…", discard: "Discarding…", reset: "Resetting…", revert: "Restoring…" }[b];
}

function DangerButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center rounded-sm bg-danger px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-danger/90 disabled:pointer-events-none disabled:opacity-60"
    >
      {children}
    </button>
  );
}

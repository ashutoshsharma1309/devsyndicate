"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A modal built on <dialog>: showModal() gives focus trapping, Escape to close
 * and an inert page behind it. Focus returns to whatever opened it; mark the
 * control that should take focus first with `data-autofocus`.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  tone = "default",
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer: ReactNode;
  tone?: "default" | "danger";
  /** While an action runs, Escape and the close button do nothing. */
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      el.showModal();
      // showModal() focuses the first control (the close button); prefer the one marked for it.
      el.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && el.open) {
      el.close();
      returnTo.current?.focus?.();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      className={cn(
        "m-auto w-[min(34rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-md border bg-white p-0 text-ink shadow-[0_24px_60px_-20px_rgb(10_11_13/0.45)] backdrop:bg-ink/40",
        tone === "danger" ? "border-danger/30" : "border-line",
      )}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-base font-medium tracking-[-0.015em]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-mute hover:bg-ink/5 hover:text-ink disabled:opacity-40"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed">{children}</div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-paper/50 px-5 py-3">{footer}</div>
        </div>
      )}
    </dialog>
  );
}

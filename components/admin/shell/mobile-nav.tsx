"use client";

import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdminBrand, AdminNavList } from "./sidebar";

/**
 * The navigation below lg, as a modal drawer. A native <dialog> opened with
 * showModal(): the page behind is inert, focus stays inside, Esc closes it, and
 * focus returns to the menu button. It also closes on navigation.
 */
export function MobileNav() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = () => dialogRef.current?.close();

  // A route change (link, Back) closes it, wherever it came from.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  // Widening past lg hides the button; don't leave an invisible modal open.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const onChange = () => mq.matches && dialogRef.current?.close();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="-ml-2 inline-flex size-10 items-center justify-center rounded-sm text-ink hover:bg-ink/5 lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" strokeWidth={1.75} />
        <span className="sr-only">Open menu</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Admin menu"
        onClose={() => setOpen(false)}
        // A click on the backdrop lands on the dialog element itself, not the panel.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="on-dark m-0 h-dvh max-h-none w-[min(20rem,calc(100vw-3rem))] max-w-none bg-ink p-0 text-white backdrop:bg-ink/50 transition-transform duration-200 ease-out starting:open:-translate-x-full lg:hidden"
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 pb-8">
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 pl-2.5">
            <AdminBrand onNavigate={close} />
            <button
              type="button"
              onClick={close}
              className="inline-flex size-10 items-center justify-center rounded-sm text-mute-dark hover:bg-white/[0.06] hover:text-white"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <div className="mt-4">
            <AdminNavList onNavigate={close} />
          </div>
        </div>
      </dialog>
    </>
  );
}

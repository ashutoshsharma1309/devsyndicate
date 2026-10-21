"use client";

import { useEffect } from "react";

export const UNSAVED_MESSAGE = "You have unsaved changes. Leave this page and lose them?";

/** Marks the extra history entry that guards Back/Forward (see below). */
const GUARD_MARK = "__dsUnsavedGuard";

/**
 * Warns before unsaved edits are lost: the browser's own prompt when the tab
 * is closed or reloaded, and a confirm() for in-app navigation (any same-tab
 * link, or a form outside `root` such as "Sign out"). Links that open a new tab
 * (e.g. Preview) and downloads are let through.
 *
 * The click listener runs on window in the capture phase, before next/link's
 * handler; preventDefault() stops the client-side navigation too.
 *
 * Browser Back/Forward fire no unload event, so while there are unsaved edits an
 * extra history entry for this same page sits on top (a copy of Next's own
 * history state, marked so it's only added once). Pressing Back pops that copy
 * — the page doesn't change — and we ask; leaving goes back one more step,
 * staying puts the copy back.
 */
export function useUnsavedChangesGuard(dirty: boolean, root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      e.returnValue = "";
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (!/^https?:$/.test(url.protocol)) return; // mailto:, tel:
      const here = new URL(window.location.href);
      // Same page, different hash (e.g. the error summary's links): not a navigation.
      if (url.origin === here.origin && url.pathname === here.pathname && url.search === here.search) return;
      if (!window.confirm(UNSAVED_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || root.current?.contains(form)) return;
      if (!window.confirm(UNSAVED_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const pushSentinel = () =>
      window.history.pushState({ ...(window.history.state ?? {}), [GUARD_MARK]: true }, "", window.location.href);
    if (!window.history.state?.[GUARD_MARK]) pushSentinel();
    let leaving = false;
    const onPopState = () => {
      if (leaving) return;
      if (window.confirm(UNSAVED_MESSAGE)) {
        leaving = true;
        window.history.back(); // the first Back only popped our copy; go back for real
      } else {
        pushSentinel();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    window.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [dirty, root]);
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Page-wide observers, re-scanned after each navigation:
 * - `[data-reveal]` elements get `.is-in` once, when they scroll into view.
 * - `[data-ambient]` containers get `[data-idle]` while they are off screen
 *   or the tab is hidden, which pauses their decorative loops. Without the
 *   attribute (on screen, or before/without this script) they run as normal.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"));
    const ambients = Array.from(document.querySelectorAll<HTMLElement>("[data-ambient]"));
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const revealIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealIo.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    reveals.forEach((el) => revealIo.observe(el));

    const onScreen = new Set<Element>();
    const sync = () => {
      const visible = document.visibilityState === "visible";
      ambients.forEach((el) => el.toggleAttribute("data-idle", !(visible && onScreen.has(el))));
    };
    const ambientIo = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      sync();
    });
    ambients.forEach((el) => ambientIo.observe(el));
    document.addEventListener("visibilitychange", sync);

    return () => {
      revealIo.disconnect();
      ambientIo.disconnect();
      document.removeEventListener("visibilitychange", sync);
      ambients.forEach((el) => el.removeAttribute("data-idle"));
    };
  }, [pathname]);

  return null;
}

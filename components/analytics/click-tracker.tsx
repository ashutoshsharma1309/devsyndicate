"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";

/**
 * One delegated listener that classifies link clicks, so server-rendered
 * links need no client code: tel: → phone_click, mailto: → email_click,
 * LinkedIn → linkedin_click, internal links to /contact → contact_cta_click.
 * Sends where on the page the click happened — never the number or address.
 * Also records the visit's landing page and referrer for lead attribution.
 */
export function ClickTracker() {
  useEffect(() => {
    captureAttribution();

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return;
      const href = a.getAttribute("href") ?? "";

      let event: AnalyticsEvent | null = null;
      if (href.startsWith("tel:")) event = "phone_click";
      else if (href.startsWith("mailto:")) event = "email_click";
      else if (a.hostname.endsWith("linkedin.com")) event = "linkedin_click";
      else if (a.origin === window.location.origin && a.pathname === "/contact" && window.location.pathname !== "/contact")
        event = "contact_cta_click";
      if (!event) return;

      const region = a.closest<HTMLElement>("[data-track-placement], section[aria-labelledby], header, footer, nav");
      track(event, {
        placement:
          region?.dataset.trackPlacement ?? region?.getAttribute("aria-labelledby") ?? region?.tagName.toLowerCase() ?? "page",
        label: a.dataset.trackLabel,
      });
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}

/**
 * Analytics boundary. The site loads no tracking script; track() forwards
 * conversion events to whichever provider is added later (Google Analytics 4
 * via gtag, Google Tag Manager via dataLayer, or Plausible) and does nothing
 * when none is present. See README → "Analytics".
 *
 * Never pass personal data here: no names, emails, phone numbers or form
 * contents — only the event name and non-identifying context.
 */

export type AnalyticsEvent =
  | "contact_cta_click"
  | "phone_click"
  | "email_click"
  | "linkedin_click"
  | "contact_form_start"
  | "contact_form_submit_success"
  | "contact_form_submit_error";

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    plausible?: (event: string, options?: { props?: AnalyticsProps }) => void;
  }
}

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") return;
  const payload = { ...props, page_path: window.location.pathname };
  try {
    if (window.gtag) window.gtag("event", event, payload);
    else window.dataLayer?.push({ event, ...payload });
    window.plausible?.(event, { props: payload });
  } catch {
    // A provider failing must never break the page.
  }
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, payload);
}

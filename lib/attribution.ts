/**
 * First-touch lead attribution, kept in sessionStorage for the visit: the page
 * the visitor landed on and the external site that sent them. Stored with a
 * lead as plain text in `source`, so the team can see which campaigns and
 * referrers bring enquiries without loading an analytics script.
 *
 * Never personal data: only allow-listed query parameters (campaign tags and
 * the form presets) are kept, and only the referrer's hostname.
 */

const KEY = "ds:attribution";
const LANDING_MAX = 150;

/** Query parameters worth keeping. Anything else (which could be personal) is dropped. */
const keptParams = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "type",
  "format",
]);

type Attribution = { landing: string; ref: string | null };

/** Path plus the allow-listed part of the query string. */
export function safePath(url: { pathname: string; search: string }, max = LANDING_MAX) {
  const params = new URLSearchParams(url.search);
  const kept = new URLSearchParams();
  for (const [k, v] of params) if (keptParams.has(k)) kept.append(k, v);
  const q = kept.toString();
  return (url.pathname + (q ? `?${q}` : "")).slice(0, max);
}

/** Records where this browser session started. Only the first call per session writes. */
export function captureAttribution() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    let ref: string | null = null;
    if (document.referrer && URL.canParse(document.referrer)) {
      const r = new URL(document.referrer);
      // Same-origin referrers (a reload, or navigation inside the site) say nothing about acquisition.
      if (r.origin !== window.location.origin && /^https?:$/.test(r.protocol)) ref = r.hostname;
    }
    const value: Attribution = { landing: safePath(window.location), ref };
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage blocked (private mode, disabled cookies): attribution is best-effort.
  }
}

/** e.g. "landing /?utm_source=linkedin · ref google.com", or "" when nothing was recorded. */
export function describeAttribution() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return "";
    const a = JSON.parse(raw) as Partial<Attribution>;
    return [
      typeof a.landing === "string" && a.landing ? `landing ${a.landing.slice(0, LANDING_MAX)}` : "",
      typeof a.ref === "string" && a.ref ? `ref ${a.ref.slice(0, 100)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  } catch {
    return "";
  }
}

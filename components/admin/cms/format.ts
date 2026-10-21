/**
 * Shared wording for content publish state. Pure: used by server pages and
 * client editors alike, so both render the same text (no hydration mismatch:
 * fixed locale and time zone).
 */

const TZ = "Asia/Kolkata";

/** "12 Oct, 14:05" (IST), with the year when it isn't this year: "12 Oct 2025, 14:05". */
export function formatStamp(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const year = (x: Date) => new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: TZ }).format(x);
  const sameYear = year(d) === year(now);
  const date = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: TZ,
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(d);
  return `${date}, ${time}`;
}

/** "Published 12 Oct, 14:05 by Asha" — `by` is the stored actor label. */
export function stampLine(verb: string, iso: string | null, by: string | null): string | null {
  if (!iso) return null;
  return `${verb} ${formatStamp(iso)}${by ? ` by ${by}` : ""}`;
}

export type PublishStatus = "published" | "changes" | "never";

export function publishStatus(s: { publishedAt: string | null; hasUnpublishedChanges: boolean }): PublishStatus {
  if (s.hasUnpublishedChanges) return "changes";
  return s.publishedAt ? "published" : "never";
}

export const STATUS_TEXT: Record<PublishStatus, string> = {
  published: "Published",
  changes: "Unpublished changes",
  never: "Never published — using defaults",
};

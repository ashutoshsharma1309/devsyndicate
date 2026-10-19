/**
 * The contact form's only connection to the backend. The UI calls
 * submitContactForm() and renders whatever it returns, so the endpoint or
 * provider behind it can change without touching the form.
 *
 * Today it posts to POST /api/leads, which validates the request, stores it
 * (Postgres, or a local JSON file in development) and emails the team. It
 * resolves `{ ok: true }` only after the server confirms one of those worked.
 */
import { spamFields, type LeadField } from "@/lib/validation/lead";

export const CONTACT_ENDPOINT = "/api/leads";

/** Raw form values. The server re-validates everything against leadSchema. */
export type ContactFormData = Record<"name" | "institution" | "email" | "phone" | "eventType", string> &
  Partial<Record<LeadField, string>>;

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; message: string; fields: Partial<Record<LeadField, string>> }
  /** Rate limited, spam check, server error or form not configured. */
  | { ok: false; reason: "rejected" | "unavailable"; message: string }
  | { ok: false; reason: "network"; message: string };

export async function submitContactForm(
  data: ContactFormData,
  /** fillMs: time from the form mounting to submit, from performance.now() (see spamFields). */
  meta: { fillMs: number; honeypot: string; source?: string },
): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        [spamFields.honeypot]: meta.honeypot,
        [spamFields.fillMs]: Math.round(meta.fillMs),
        source: meta.source,
      }),
    });
  } catch {
    return { ok: false, reason: "network", message: "We couldn't reach our server. Check your connection and try again." };
  }

  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    fields?: Partial<Record<LeadField, string>>;
  };

  if (res.ok && body.ok) return { ok: true };
  if (res.status === 422 && body.fields) {
    return { ok: false, reason: "invalid", message: body.error ?? "Some details need another look.", fields: body.fields };
  }
  return {
    ok: false,
    reason: res.status >= 500 ? "unavailable" : "rejected",
    message: body.error ?? "Something went wrong on our side.",
  };
}

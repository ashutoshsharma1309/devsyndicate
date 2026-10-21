import { after, NextResponse, type NextRequest } from "next/server";
import { safePath } from "@/lib/attribution";
import { getContactInfo, getFormConfig } from "@/lib/cms";
import { getMailer, notificationAddress, type Mailer } from "@/lib/email";
import { leadAcknowledgement } from "@/lib/email/lead-acknowledgement";
import { leadNotification } from "@/lib/email/lead-notification";
import { getLeadStore } from "@/lib/leads/store";
import type { Lead } from "@/lib/leads/types";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, leadSchema, MIN_FILL_MS, spamFields, type LeadData } from "@/lib/validation/lead";

const MAX_BODY_BYTES = 20_000;
const MAX_SOURCE_CHARS = 300;
const PER_IP_WINDOW = { limit: 5, ms: 10 * 60_000 };
const PER_IP_HOURLY_STORED = 8;

/**
 * Two ways in:
 * - "json": the hydrated contact form, via submitContactForm(). Gets JSON back.
 * - "form": a plain HTML form post (JavaScript disabled, or Send pressed before
 *   the page hydrated). Gets a 303 back to /contact/sent|invalid|error — a
 *   prerendered page that shows the outcome without JavaScript. Never the
 *   visitor's details in the URL.
 */
type Mode = "json" | "form";

type Outcome =
  | { ok: true; status: 200 | 201 }
  | { ok: false; status: number; error: string; fields?: Record<string, string>; headers?: HeadersInit };

type ErrorBody = { ok: false; error: string; fields?: Record<string, string> };

const failure = (status: number, error: string, extra?: Pick<Extract<Outcome, { ok: false }>, "fields" | "headers">): Outcome => ({
  ok: false,
  status,
  error,
  ...extra,
});

function respond(mode: Mode, o: Outcome) {
  if (mode === "json") {
    return o.ok
      ? NextResponse.json({ ok: true }, { status: o.status })
      : NextResponse.json<ErrorBody>(
          { ok: false, error: o.error, ...(o.fields ? { fields: o.fields } : {}) },
          { status: o.status, headers: o.headers },
        );
  }
  const enquiry = o.ok ? "sent" : o.status === 400 || o.status === 422 ? "invalid" : "error";
  // Relative Location keeps the redirect on whichever host the visitor used.
  return new Response(null, { status: 303, headers: { Location: `/contact/${enquiry}#enquiry` } });
}

export async function POST(req: NextRequest) {
  // Same-origin only: browsers always send Origin on a cross-site POST.
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!URL.canParse(origin) || new URL(origin).host !== host) {
      return NextResponse.json<ErrorBody>({ ok: false, error: "Requests from other sites are not accepted." }, { status: 403 });
    }
  }

  const contentType = req.headers.get("content-type") ?? "";
  const ct = contentType.toLowerCase();
  const mode: Mode | null = ct.includes("application/json")
    ? "json"
    : ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")
      ? "form"
      : null;
  if (!mode) {
    return NextResponse.json<ErrorBody>({ ok: false, error: "Unsupported request format." }, { status: 415 });
  }

  return respond(mode, await accept(req, mode, contentType));
}

async function accept(req: NextRequest, mode: Mode, contentType: string): Promise<Outcome> {
  // Published settings only, so an admin's unpublished preview can't change what is accepted.
  const form = await getFormConfig({ published: true });
  if (!form.enabled) {
    return failure(503, "Our enquiry form isn't taking new enquiries at the moment. Please call or email us instead.");
  }

  const ip = clientIp(req.headers);
  const limited = rateLimit(`lead:${ip}`, PER_IP_WINDOW.limit, PER_IP_WINDOW.ms);
  if (!limited.ok) {
    return failure(429, "Too many requests from this network. Please try again a little later, or email us directly.", {
      headers: { "Retry-After": String(limited.retryAfter) },
    });
  }

  if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) return failure(413, "That request is too large.");
  const raw = await req.arrayBuffer();
  if (raw.byteLength > MAX_BODY_BYTES) return failure(413, "That request is too large.");

  let body: Record<string, unknown>;
  try {
    if (mode === "json") {
      body = JSON.parse(new TextDecoder().decode(raw));
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    } else {
      const form = await new Response(raw, { headers: { "content-type": contentType } }).formData();
      body = Object.fromEntries([...form].filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    }
  } catch {
    return failure(400, "We couldn't read that request.");
  }

  // Honeypot: pretend it worked so bots don't adapt.
  if (typeof body[spamFields.honeypot] === "string" && body[spamFields.honeypot] !== "") {
    console.warn(`[leads] Honeypot filled (${mode} request) — submission discarded.`);
    return { ok: true, status: 200 };
  }
  // Fill time is measured by the hydrated form only; a plain form post has no script to measure it.
  if (mode === "json") {
    const fillMs = Number(body[spamFields.fillMs]);
    if (!Number.isFinite(fillMs) || fillMs < MIN_FILL_MS) {
      return failure(400, "That was quicker than expected. Please check your details and submit again.");
    }
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return failure(422, "Some details need another look.", { fields: fieldErrors(parsed.error.issues) });
  }
  const lead = parsed.data;
  // New enquiries must use a type the form currently offers. The schema also accepts older
  // types, which stay valid for leads that are already stored.
  if (!form.enquiryTypes.some((t) => t.value === lead.eventType)) {
    return failure(422, "Some details need another look.", { fields: { eventType: "Choose what your enquiry is about." } });
  }
  const ipHash = hashIp(ip);
  const source = mode === "json" ? jsonSource(body.source) : formSource(req);

  const [store, mailer] = await Promise.all([getLeadStore(), getMailer()]);
  if (!store && !mailer) {
    console.error("[leads] Neither DATABASE_URL nor SMTP_HOST is configured — cannot accept leads.");
    return failure(503, "Our form is temporarily unavailable.");
  }

  let saved: Lead | null = null;
  if (store) {
    try {
      const recent = await store.countRecent(ipHash, new Date(Date.now() - 60 * 60_000));
      if (recent >= PER_IP_HOURLY_STORED) {
        return failure(429, "We've already received several requests from this network. We'll be in touch.");
      }
      saved = await store.create({ ...lead, source, ipHash });
    } catch (err) {
      console.error("[leads] Failed to store lead", err);
    }
  }

  // Resolved now, inside the request: published content only.
  const [recipient, contact] = mailer ? await Promise.all([notificationAddress(), getContactInfo({ published: true })]) : [null, null];
  const ack: AckOptions | null = recipient && contact ? { contact, replyTo: recipient } : null;
  const notification = mailer && recipient ? leadNotification(lead, { to: recipient, id: saved?.id, source }) : null;

  if (store && saved) {
    // Stored safely — email the team without making the visitor wait, then record whether it went.
    if (mailer && notification) {
      const id = saved.id;
      after(async () => {
        let status: "sent" | "failed" = "sent";
        try {
          await mailer.send(notification);
        } catch (err) {
          status = "failed";
          console.error("[leads] Notification email failed", err);
        }
        try {
          await store.markNotified(id, status);
        } catch (err) {
          console.error("[leads] Couldn't record notification status", err);
        }
        if (ack) await acknowledge(mailer, lead, ack);
      });
    }
    return { ok: true, status: 201 };
  }

  // Not stored: the email is the only record, so it has to succeed.
  if (mailer && notification) {
    try {
      await mailer.send(notification);
      after(() => (ack ? acknowledge(mailer, lead, ack) : undefined));
      return { ok: true, status: 201 };
    } catch (err) {
      console.error("[leads] Notification email failed (lead not stored)", err);
    }
  }
  return failure(503, "We couldn't send your request just now.");
}

const ACK_PER_RECIPIENT = { limit: 1, ms: 24 * 60 * 60_000 };

type AckOptions = Parameters<typeof leadAcknowledgement>[1];

/**
 * Confirmation to the enquirer. Best-effort: it never affects the response.
 * Capped per recipient address (not just per IP), so the form can't be used to
 * send repeated mail to someone else's inbox from rotating IPs.
 */
async function acknowledge(mailer: Mailer, lead: LeadData, opts: AckOptions) {
  if (!rateLimit(`ack:${lead.email.toLowerCase()}`, ACK_PER_RECIPIENT.limit, ACK_PER_RECIPIENT.ms).ok) return;
  try {
    await mailer.send(leadAcknowledgement(lead, opts));
  } catch (err) {
    console.error("[leads] Acknowledgement email failed", err);
  }
}

/** The form sends "<form page> | <first-touch attribution>" (see lib/attribution.ts). */
const jsonSource = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, MAX_SOURCE_CHARS) : null);

/** A plain form post has no attribution; record the page it came from (same-origin Referer only). */
function formSource(req: NextRequest) {
  const referer = req.headers.get("referer");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const page = referer && URL.canParse(referer) && new URL(referer).host === host ? safePath(new URL(referer)) : "unknown page";
  return `${page} | form post without JavaScript`.slice(0, MAX_SOURCE_CHARS);
}

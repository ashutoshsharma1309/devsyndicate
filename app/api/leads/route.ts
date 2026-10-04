import { after, NextResponse, type NextRequest } from "next/server";
import { getMailer, notificationAddress } from "@/lib/email";
import { leadNotification } from "@/lib/email/lead-notification";
import { getLeadStore } from "@/lib/leads/store";
import type { Lead } from "@/lib/leads/types";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, leadSchema, MIN_FILL_MS, spamFields } from "@/lib/validation/lead";

const MAX_BODY_BYTES = 20_000;
const PER_IP_WINDOW = { limit: 5, ms: 10 * 60_000 };
const PER_IP_HOURLY_STORED = 8;

type ErrorBody = { ok: false; error: string; fields?: Record<string, string> };

const fail = (status: number, error: string, extra?: Partial<ErrorBody>, headers?: HeadersInit) =>
  NextResponse.json<ErrorBody>({ ok: false, error, ...extra }, { status, headers });

export async function POST(req: NextRequest) {
  // Same-origin only: browsers always send Origin on a cross-site POST.
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!URL.canParse(origin) || new URL(origin).host !== host) {
      return fail(403, "Requests from other sites are not accepted.");
    }
  }
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return fail(415, "Unsupported request format.");
  }

  const ip = clientIp(req.headers);
  const limited = rateLimit(`lead:${ip}`, PER_IP_WINDOW.limit, PER_IP_WINDOW.ms);
  if (!limited.ok) {
    return fail(429, "Too many requests from this network. Please try again a little later, or email us directly.", {}, {
      "Retry-After": String(limited.retryAfter),
    });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "That request is too large.");

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    return fail(400, "We couldn't read that request.");
  }

  // Honeypot: pretend it worked so bots don't adapt.
  if (typeof body[spamFields.honeypot] === "string" && body[spamFields.honeypot] !== "") {
    return NextResponse.json({ ok: true });
  }
  const startedAt = Number(body[spamFields.startedAt]);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return fail(400, "That was quicker than expected. Please check your details and submit again.");
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(422, "Some details need another look.", { fields: fieldErrors(parsed.error.issues) });
  }
  const lead = parsed.data;
  const ipHash = hashIp(ip);
  const source = typeof body.source === "string" ? body.source.slice(0, 200) : null;

  const [store, mailer] = await Promise.all([getLeadStore(), getMailer()]);
  if (!store && !mailer) {
    console.error("[leads] Neither DATABASE_URL nor SMTP_HOST is configured — cannot accept leads.");
    return fail(503, "Our form is temporarily unavailable.");
  }

  let saved: Lead | null = null;
  if (store) {
    try {
      const recent = await store.countRecent(ipHash, new Date(Date.now() - 60 * 60_000));
      if (recent >= PER_IP_HOURLY_STORED) {
        return fail(429, "We've already received several requests from this network. We'll be in touch.");
      }
      saved = await store.create({ ...lead, source, ipHash });
    } catch (err) {
      console.error("[leads] Failed to store lead", err);
    }
  }

  const email = mailer ? leadNotification(lead, { to: notificationAddress(), id: saved?.id }) : null;

  if (saved) {
    // Stored safely — send the notification without making the visitor wait.
    if (mailer && email) {
      after(() => mailer.send(email).catch((err) => console.error("[leads] Notification email failed", err)));
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // Not stored: the email is the only record, so it has to succeed.
  if (mailer && email) {
    try {
      await mailer.send(email);
      return NextResponse.json({ ok: true }, { status: 201 });
    } catch (err) {
      console.error("[leads] Notification email failed (lead not stored)", err);
    }
  }
  return fail(503, "We couldn't send your request just now.");
}

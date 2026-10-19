import "server-only";
import { site } from "@/lib/site";
import { allEventTypes, labelFor, type LeadData } from "@/lib/validation/lead";
import { notificationAddress, type Email } from "./index";

/**
 * Confirmation sent to the person who submitted the contact form.
 *
 * Anyone can type any address into the form, so this email must be useless
 * as a spam vehicle: it never repeats anything the visitor typed (no name,
 * institution or message) — only the enquiry type, which comes from a fixed
 * list. It also promises no response time.
 */

/** Mirrors "What happens next" on /contact. */
const steps = [
  ["We review your enquiry", "We look at your objectives, scale and timeline before we call."],
  ["A short conversation", "We talk through what you want to achieve and what's realistic."],
  ["A clear proposal", "Format, timeline, scope and who handles what — in writing."],
] as const;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function leadAcknowledgement(lead: Pick<LeadData, "email" | "eventType">): Email {
  const enquiry = labelFor(allEventTypes, lead.eventType);
  const contact = site.primaryContact;

  const text = [
    `Thank you for contacting ${site.name}.`,
    "",
    `We've received your enquiry (${enquiry}) and it has reached our team.`,
    "",
    "What happens next",
    ...steps.map(([title, body], i) => `${i + 1}. ${title} — ${body}`),
    "",
    `To talk sooner, call ${contact.name} (${contact.role}) on ${contact.phone.display}, or email ${site.email}.`,
    "You can also reply to this email.",
    "",
    `If you didn't send an enquiry to ${site.name}, you can ignore this email.`,
    "",
    `— ${site.name}`,
    site.url,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f0;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0a0b0d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #d9d9d1;border-radius:8px">
<tr><td style="padding:28px 32px;border-bottom:1px solid #eaeae4">
<p style="margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#3a4cff;font-family:ui-monospace,Menlo,monospace">Enquiry received</p>
<h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;letter-spacing:-.02em">Thank you for contacting ${esc(site.name)}.</h1>
<p style="margin:8px 0 0;color:#5b5e66;font-size:14px;line-height:1.6">We've received your enquiry (${esc(enquiry)}) and it has reached our team.</p>
</td></tr>
<tr><td style="padding:20px 32px 4px">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b5e66;font-family:ui-monospace,Menlo,monospace">What happens next</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
${steps
  .map(
    ([title, body], i) =>
      `<tr><td style="padding:8px 0;width:32px;vertical-align:top;color:#3a4cff;font-family:ui-monospace,Menlo,monospace">${String(i + 1).padStart(2, "0")}</td><td style="padding:8px 0;vertical-align:top"><strong style="font-weight:600">${esc(title)}</strong><br><span style="color:#5b5e66;line-height:1.6">${esc(body)}</span></td></tr>`,
  )
  .join("")}
</table></td></tr>
<tr><td style="padding:20px 32px 28px">
<p style="margin:0;font-size:14px;line-height:1.6">To talk sooner, call ${esc(contact.name)} (${esc(contact.role)}) on <a href="${esc(contact.phone.href)}" style="color:#0a0b0d">${esc(contact.phone.display)}</a>, or email <a href="mailto:${esc(site.email)}" style="color:#0a0b0d">${esc(site.email)}</a>. You can also reply to this email.</p>
<p style="margin:16px 0 0;font-size:12px;color:#5b5e66">If you didn't send an enquiry to ${esc(site.name)}, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;

  return {
    to: lead.email,
    replyTo: notificationAddress(),
    subject: `We've received your enquiry — ${site.name}`,
    text,
    html,
  };
}

import "server-only";
import { site } from "@/lib/site";
import {
  eventFormats,
  eventTypes,
  labelFor,
  participantRanges,
  timelines,
  type LeadData,
} from "@/lib/validation/lead";
import type { Email } from "./index";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Header-safe: no line breaks in the subject.
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").slice(0, 120);

export function leadNotification(lead: LeadData, opts: { to: string; id?: string }): Email {
  const groups: [string, [string, string][]][] = [
    [
      "Institution",
      [
        ["Institution", lead.institution],
        ["City", lead.city],
        ["State", lead.state],
        ["Website", lead.website || "—"],
      ],
    ],
    [
      "Contact",
      [
        ["Name", lead.name],
        ["Designation", lead.designation],
        ["Email", lead.email],
        ["Phone", lead.phone],
      ],
    ],
    [
      "Event",
      [
        ["Event type", labelFor(eventTypes, lead.eventType)],
        ["Expected participants", labelFor(participantRanges, lead.participants)],
        ["Format", labelFor(eventFormats, lead.format)],
        ["Timeline", labelFor(timelines, lead.timeline)],
        ["Theme / technology", lead.theme || "—"],
      ],
    ],
  ];

  const adminUrl = opts.id ? `${site.url}/admin/leads/${opts.id}` : null;

  const text = [
    `New hackathon request from ${lead.institution}`,
    "",
    ...groups.flatMap(([title, rows]) => [`— ${title} —`, ...rows.map(([k, v]) => `${k}: ${v}`), ""]),
    "— Additional requirements —",
    lead.message || "—",
    "",
    adminUrl ? `Open in admin: ${adminUrl}` : "",
    "Reply to this email to respond directly to the requester.",
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f0;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0a0b0d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #d9d9d1;border-radius:8px">
<tr><td style="padding:28px 32px;border-bottom:1px solid #eaeae4">
<p style="margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#3a4cff;font-family:ui-monospace,Menlo,monospace">New hackathon request</p>
<h1 style="margin:10px 0 0;font-size:22px;line-height:1.25;letter-spacing:-.02em">${esc(lead.institution)}</h1>
<p style="margin:6px 0 0;color:#5b5e66;font-size:14px">${esc(lead.name)}, ${esc(lead.designation)} · ${esc(lead.city)}, ${esc(lead.state)}</p>
</td></tr>
${groups
  .map(
    ([title, rows]) => `<tr><td style="padding:20px 32px 4px">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b5e66;font-family:ui-monospace,Menlo,monospace">${esc(title)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:6px 0;color:#5b5e66;width:42%;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;vertical-align:top">${esc(v)}</td></tr>`,
  )
  .join("")}
</table></td></tr>`,
  )
  .join("")}
<tr><td style="padding:20px 32px 28px">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b5e66;font-family:ui-monospace,Menlo,monospace">Additional requirements</p>
<p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(lead.message || "—")}</p>
${
  adminUrl
    ? `<p style="margin:24px 0 0"><a href="${esc(adminUrl)}" style="display:inline-block;background:#3a4cff;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px">Open in admin</a></p>`
    : ""
}
<p style="margin:16px 0 0;font-size:12px;color:#5b5e66">Reply to this email to respond directly to ${esc(lead.name)}.</p>
</td></tr></table></td></tr></table></body></html>`;

  return {
    to: opts.to,
    replyTo: lead.email,
    subject: oneLine(`Hackathon request — ${lead.institution} (${labelFor(eventTypes, lead.eventType)})`),
    text,
    html,
  };
}

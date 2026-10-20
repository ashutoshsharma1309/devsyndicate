import type { NextRequest } from "next/server";
import { readLeadFilters } from "@/components/admin/lead-filters";
import { audit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { leadStatuses, type Lead } from "@/lib/leads/types";
import { allEventTypes, eventFormats, labelFor, orgTypes, participantRanges, timelines } from "@/lib/validation/lead";

// India has no daylight saving, so a fixed offset is exact.
const IST_OFFSET_MS = 330 * 60_000;
const ist = (iso: string) => new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString();

/** Label for a stored option; blank (not "—") when the field was left empty, so the cell stays empty. */
const opt = (opts: readonly { value: string; label: string }[], v: string) => (v ? labelFor(opts, v) : "");

const columns: [header: string, value: (l: Lead) => string][] = [
  ["Received", (l) => ist(l.createdAt).slice(0, 16).replace("T", " ")],
  ["Status", (l) => opt(leadStatuses, l.status)],
  ["Organisation type", (l) => opt(orgTypes, l.orgType)],
  ["Institution", (l) => l.institution],
  ["City", (l) => l.city],
  ["State", (l) => l.state],
  ["Contact name", (l) => l.name],
  ["Designation", (l) => l.designation],
  ["Email", (l) => l.email],
  ["Phone", (l) => l.phone],
  ["Enquiry type", (l) => opt(allEventTypes, l.eventType)],
  ["Participants", (l) => opt(participantRanges, l.participants)],
  ["Format", (l) => opt(eventFormats, l.format)],
  ["Timeline", (l) => opt(timelines, l.timeline)],
  ["Message", (l) => l.message],
  ["Source", (l) => l.source ?? ""],
];

/**
 * One CSV field (RFC 4180). Visitor-typed text is untrusted: a leading = + - @
 * (or tab/CR) makes spreadsheets evaluate it as a formula, so it gets a
 * leading apostrophe, which they display as plain text.
 */
function field(raw: string | null | undefined) {
  let v = raw ?? "";
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** GET /admin/leads/export?<same filters as /admin/leads> → every matching lead as CSV. */
export async function GET(req: NextRequest) {
  // proxy.ts only checks the cookie's signature; this also checks the account is still active.
  const session = await requireAdmin();
  const store = await getLeadStore();
  if (!store) {
    return new Response("Lead storage isn't configured, so there is nothing to export.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const { filters } = readLeadFilters(req.nextUrl.searchParams);
  const leads = await store.listAll(filters);
  const lines = [columns.map(([h]) => field(h)).join(",")];
  for (const l of leads) lines.push(columns.map(([, get]) => field(get(l))).join(","));
  // BOM so Excel reads the file as UTF-8 (Indian names, ₹, en dashes); CRLF per RFC 4180.
  const body = `﻿${lines.join("\r\n")}\r\n`;

  // Counts only: the filters can contain a searched name or email.
  await audit(session, "export", { detail: `${leads.length} ${leads.length === 1 ? "row" : "rows"}` });

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="devsyndicate-leads-${ist(new Date().toISOString()).slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

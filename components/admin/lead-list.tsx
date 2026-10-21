import Link from "next/link";
import { FollowUp } from "@/components/admin/lead-format";
import { NotifyFailedBadge, OrgTypeBadge, StatusBadge } from "@/components/admin/status-badge";
import type { Lead, LeadSort } from "@/lib/leads/types";
import { formatDate, formatLocation } from "@/lib/utils";
import { allEventTypes, eventFormats, labelFor, participantRanges } from "@/lib/validation/lead";

/** Event details on one line, leaving out what the enquirer didn't answer. */
const eventDetails = (l: Lead) =>
  [l.participants && labelFor(participantRanges, l.participants), l.format && labelFor(eventFormats, l.format)]
    .filter(Boolean)
    .join(" · ");

/**
 * The lead list: a table from `lg` up, stacked cards below it. Both are rendered and
 * one is hidden with CSS, so the page works without JavaScript and never scrolls sideways.
 */
export function LeadList({ leads, sort, today }: { leads: Lead[]; sort: LeadSort; today: string }) {
  const byUpdated = sort === "updated";
  const dateOf = (l: Lead) => formatDate(byUpdated ? l.updatedAt : l.createdAt);
  return (
    <>
      <div className="mt-6 hidden overflow-x-auto rounded-md border border-line bg-white lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Leads, {sortCaption[sort]}</caption>
          <thead className="border-b border-line bg-paper/60">
            <tr className="t-label text-mute">
              <th scope="col" className="px-4 py-3 font-normal">Institution</th>
              <th scope="col" className="px-4 py-3 font-normal">Contact</th>
              <th scope="col" className="px-4 py-3 font-normal">Enquiry</th>
              <th scope="col" className="px-4 py-3 font-normal">Status</th>
              <th scope="col" className="px-4 py-3 font-normal">Next follow-up</th>
              <th scope="col" className="px-4 py-3 text-right font-normal">{byUpdated ? "Updated" : "Received"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {leads.map((l) => (
              <tr key={l.id} className="group relative transition-colors duration-150 hover:bg-paper/60">
                <td className="max-w-[18rem] px-4 py-3.5 align-top">
                  {/* The whole row is the link; the pseudo-element covers it. */}
                  <Link
                    href={`/admin/leads/${l.id}`}
                    className="break-words font-medium after:absolute after:inset-0 after:content-[''] group-hover:text-signal focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-signal"
                  >
                    {l.institution}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-mute">
                    <OrgTypeBadge orgType={l.orgType} />
                    <span>{formatLocation(l)}</span>
                  </div>
                </td>
                <td className="max-w-[16rem] px-4 py-3.5 align-top">
                  <div className="break-words">{l.name}</div>
                  <div className="mt-0.5 break-all text-mute">{l.email}</div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <div>{labelFor(allEventTypes, l.eventType)}</div>
                  {eventDetails(l) && <div className="mt-0.5 text-mute">{eventDetails(l)}</div>}
                </td>
                <td className="px-4 py-3.5 align-top">
                  <div className="flex flex-col items-start gap-1.5">
                    <StatusBadge status={l.status} />
                    {l.notifyStatus === "failed" && <NotifyFailedBadge />}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 align-top">
                  <FollowUp lead={l} today={today} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right align-top tabular-nums text-mute">{dateOf(l)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-md border border-line bg-white lg:hidden" aria-label="Leads">
        {leads.map((l) => (
          <li key={l.id} className="relative px-4 py-4 transition-colors duration-150 hover:bg-paper/60">
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/admin/leads/${l.id}`}
                className="min-w-0 break-words font-medium after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-signal"
              >
                {l.institution}
              </Link>
              <span className="shrink-0 text-xs tabular-nums text-mute">
                <span className="sr-only">{byUpdated ? "Updated " : "Received "}</span>
                {dateOf(l)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={l.status} />
              {l.notifyStatus === "failed" && <NotifyFailedBadge />}
              <OrgTypeBadge orgType={l.orgType} />
            </div>
            <dl className="mt-3 grid gap-1 text-sm">
              <div className="flex gap-2">
                <dt className="sr-only">Contact</dt>
                <dd className="min-w-0 break-words">
                  {l.name}
                  <span className="text-mute"> · </span>
                  <span className="break-all text-mute">{l.email}</span>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="sr-only">Enquiry</dt>
                <dd className="text-mute">
                  {labelFor(allEventTypes, l.eventType)}
                  {formatLocation(l) !== "—" && <> · {formatLocation(l)}</>}
                </dd>
              </div>
              {l.nextFollowUp && (
                <div className="flex items-center gap-2">
                  <dt className="text-mute">Follow-up</dt>
                  <dd>
                    <FollowUp lead={l} today={today} />
                  </dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

const sortCaption: Record<LeadSort, string> = {
  newest: "newest first",
  oldest: "oldest first",
  updated: "most recently updated first",
};

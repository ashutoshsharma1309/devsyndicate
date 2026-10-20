import Link from "next/link";
import { FlashToast } from "@/components/admin/forms";
import { hasLeadFilters, LeadFilterBar, leadFilterQuery, readLeadFilters } from "@/components/admin/lead-filters";
import { NotifyFailedBadge, OrgTypeBadge, StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { DEFAULT_PAGE_SIZE, type LeadPage } from "@/lib/leads/types";
import { cn, formatDate, formatLocation } from "@/lib/utils";
import { allEventTypes, eventFormats, labelFor, participantRanges } from "@/lib/validation/lead";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireAdmin();
  const sp = await searchParams;
  const { values, filters } = readLeadFilters(sp);
  const filtered = hasLeadFilters(values);
  const requested = Number.parseInt(String(sp.page ?? "1"), 10);

  const store = await getLeadStore();
  let result: LeadPage = { leads: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE };
  if (store) {
    result = await store.list({ ...filters, page: requested });
    // A page past the end (bookmarked, or leads deleted since) shows the last page rather than nothing.
    if (result.leads.length === 0 && result.total > 0) {
      result = await store.list({ ...filters, page: Math.ceil(result.total / result.pageSize) });
    }
  }
  const { leads, total, page, pageSize } = result;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const firstShown = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = (page - 1) * pageSize + leads.length;
  // Set by the deleteLead action's redirect.
  const deleted = sp.deleted === "1";

  return (
    <div>
      {deleted && <FlashToast message="Lead and its notes deleted." param="deleted" />}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <h1 className="text-3xl font-medium tracking-[-0.035em]">Leads</h1>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <p className="text-sm tabular-nums text-mute" aria-live="polite">
            {total} {total === 1 ? "request" : "requests"}
            {filtered && (total === 1 ? " matches these filters" : " match these filters")}
          </p>
          {total > 0 && (
            // A plain link: the browser downloads it, and the export re-checks the session itself.
            <a
              href={`/admin/leads/export${leadFilterQuery(values)}`}
              className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-white px-3 py-1.5 text-sm hover:border-ink/30"
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
              </svg>
              Export CSV
              <span className="sr-only">
                {" "}
                ({total} {total === 1 ? "row" : "rows"}
                {filtered ? ", current filters" : ""})
              </span>
            </a>
          )}
        </div>
      </div>

      <LeadFilterBar values={values} />

      {leads.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed border-line p-10 text-center text-sm text-mute">
          {filtered ? (
            <>
              No leads match these filters.{" "}
              <Link href="/admin/leads" className="text-signal hover:underline">
                Clear filters
              </Link>
            </>
          ) : (
            "No requests yet. New submissions from the contact form appear here."
          )}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-md border border-line bg-white">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-line bg-paper/60">
              <tr className="t-label text-mute">
                <th scope="col" className="px-5 py-3 font-normal">Institution</th>
                <th scope="col" className="px-5 py-3 font-normal">Contact</th>
                <th scope="col" className="px-5 py-3 font-normal">Event</th>
                <th scope="col" className="px-5 py-3 font-normal">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-normal">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((l) => (
                <tr key={l.id} className="group relative hover:bg-paper/60">
                  <td className="px-5 py-4 align-top">
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="font-medium after:absolute after:inset-0 after:content-[''] group-hover:text-signal"
                    >
                      {l.institution}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-mute">
                      <OrgTypeBadge orgType={l.orgType} />
                      <span>{formatLocation(l)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div>{l.name}</div>
                    {l.designation && <div className="mt-0.5 text-mute">{l.designation}</div>}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div>{labelFor(allEventTypes, l.eventType)}</div>
                    <div className="mt-0.5 text-mute">
                      {labelFor(participantRanges, l.participants)} · {labelFor(eventFormats, l.format)}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge status={l.status} />
                      {l.notifyStatus === "failed" && <NotifyFailedBadge />}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right align-top tabular-nums text-mute">
                    {formatDate(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="tabular-nums text-mute">
            Showing {firstShown}–{lastShown} of {total}
          </p>
          {lastPage > 1 && (
            <div className="flex items-center gap-2">
              <PageLink href={page > 1 ? `/admin/leads${leadFilterQuery(values, page - 1)}` : null} rel="prev">
                ← Previous
              </PageLink>
              <span className="px-1 tabular-nums text-mute">
                Page {page} of {lastPage}
              </span>
              <PageLink href={page < lastPage ? `/admin/leads${leadFilterQuery(values, page + 1)}` : null} rel="next">
                Next →
              </PageLink>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}

/** Prev/next link that keeps the filters; disabled (not a link) at either end. */
function PageLink({ href, rel, children }: { href: string | null; rel: "prev" | "next"; children: React.ReactNode }) {
  const cls = "inline-flex h-9 items-center rounded-sm border px-3";
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(cls, "border-line text-mute/70")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} rel={rel} className={cn(cls, "border-line bg-white hover:border-ink/30")}>
      {children}
    </Link>
  );
}

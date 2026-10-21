import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Inbox, TriangleAlert } from "lucide-react";
import { FlashToast } from "@/components/admin/forms";
import { hasLeadFilters, LeadFilterBar, leadFilterQuery, readLeadFilters } from "@/components/admin/lead-filters";
import { istTodayLocal } from "@/components/admin/lead-format";
import { LeadList } from "@/components/admin/lead-list";
import { AdminPageHeader } from "@/components/admin/shell/page-header";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { DEFAULT_PAGE_SIZE, MAX_PAGE, type LeadPage } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireAdmin();
  const sp = await searchParams;
  const { values, filters } = readLeadFilters(sp);
  const filtered = hasLeadFilters(values);
  const rawPage = Number.parseInt(String((Array.isArray(sp.page) ? sp.page[0] : sp.page) ?? "1"), 10);
  const requested = Number.isFinite(rawPage) ? Math.min(MAX_PAGE, Math.max(1, rawPage)) : 1;

  const store = await getLeadStore();
  let result: LeadPage = { leads: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE };
  let failed = false;
  if (store) {
    try {
      result = await store.list({ ...filters, page: requested });
      // A page past the end (bookmarked, or leads deleted since) shows the last page rather than nothing.
      if (result.leads.length === 0 && result.total > 0) {
        result = await store.list({ ...filters, page: Math.ceil(result.total / result.pageSize) });
      }
    } catch (err) {
      failed = true;
      console.error("[admin] Couldn't list leads:", (err as { code?: string })?.code ?? "unknown error");
    }
  }
  const { leads, total, page, pageSize } = result;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const firstShown = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = (page - 1) * pageSize + leads.length;
  // Set by the deleteLead action's redirect.
  const deleted = sp.deleted === "1";
  // On the organisations link the key is normalised; show a real spelling when there is one.
  const orgLabel = values.org ? leads[0]?.institution : undefined;

  return (
    <div>
      {deleted && <FlashToast message="Lead and its notes deleted." param="deleted" />}
      <AdminPageHeader
        title="Leads"
        description="Enquiries from the contact form. Search, filter and open a lead to work on it."
        meta={
          failed ? undefined : (
            <span className="tabular-nums">
              {total} {total === 1 ? "request" : "requests"}
              {filtered && (total === 1 ? " matches these filters" : " match these filters")}
            </span>
          )
        }
        actions={
          total > 0 && (
            // A plain link: the browser downloads it, and the export re-checks the session itself.
            <a
              href={`/admin/leads/export${leadFilterQuery(values)}`}
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-ink/15 bg-white px-3.5 text-sm font-medium transition-colors duration-150 hover:border-ink/40"
            >
              <Download aria-hidden="true" className="size-4" />
              Export CSV
              <span className="sr-only">
                {" "}
                ({total} {total === 1 ? "row" : "rows"}
                {filtered ? ", current filters" : ""})
              </span>
            </a>
          )
        }
      />

      {/* Keyed on the filters: a client-side navigation that only changes the query string (a dashboard
          tile, "Clear all", the sidebar link) keeps this component mounted, and uncontrolled selects
          ignore new defaultValues — remounting resets every control to the current filters. */}
      <LeadFilterBar key={leadFilterQuery(values)} values={values} orgLabel={orgLabel} />

      {failed ? (
        <div role="alert" className="mt-6 rounded-md border border-danger/25 bg-white p-6 text-sm sm:p-8">
          <p className="flex items-center gap-2 font-medium text-danger">
            <TriangleAlert aria-hidden="true" className="size-4" />
            The leads couldn&apos;t be loaded
          </p>
          <p className="mt-2 text-mute">
            The lead database didn&apos;t respond. This is usually temporary. Nothing has been changed.
          </p>
          <Link
            href={`/admin/leads${leadFilterQuery(values, page)}`}
            className="mt-4 inline-flex h-10 items-center rounded-sm border border-ink/15 px-3.5 font-medium hover:border-ink/40"
          >
            Try again
          </Link>
        </div>
      ) : !store ? (
        <EmptyState>Lead storage isn&apos;t configured, so there are no leads to show.</EmptyState>
      ) : leads.length === 0 ? (
        <EmptyState>
          {filtered ? (
            <>
              No leads match these filters.{" "}
              <Link href="/admin/leads" className="font-medium text-signal underline-offset-4 hover:underline">
                Clear filters
              </Link>
            </>
          ) : (
            "No requests yet. New submissions from the contact form appear here."
          )}
        </EmptyState>
      ) : (
        <LeadList leads={leads} sort={values.sort || "newest"} today={istTodayLocal()} />
      )}

      {!failed && total > 0 && (
        <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="tabular-nums text-mute">
            Showing {firstShown}–{lastShown} of {total}
          </p>
          {lastPage > 1 && (
            <div className="flex items-center gap-2">
              <PageLink href={page > 1 ? `/admin/leads${leadFilterQuery(values, page - 1)}` : null} rel="prev">
                <ChevronLeft aria-hidden="true" className="size-4" />
                Previous
              </PageLink>
              <span className="px-1 tabular-nums text-mute">
                Page {page} of {lastPage}
              </span>
              <PageLink href={page < lastPage ? `/admin/leads${leadFilterQuery(values, page + 1)}` : null} rel="next">
                Next
                <ChevronRight aria-hidden="true" className="size-4" />
              </PageLink>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-md border border-dashed border-line px-6 py-12 text-center text-sm text-mute">
      <Inbox aria-hidden="true" className="size-5" />
      <p>{children}</p>
    </div>
  );
}

/** Prev/next link that keeps the filters; disabled (not a link) at either end. */
function PageLink({ href, rel, children }: { href: string | null; rel: "prev" | "next"; children: React.ReactNode }) {
  const cls = "inline-flex h-9 items-center gap-1 rounded-sm border px-3";
  if (!href) {
    return (
      <span aria-disabled="true" className={cn(cls, "border-line text-mute/70")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} rel={rel} className={cn(cls, "border-line bg-white transition-colors duration-150 hover:border-ink/30")}>
      {children}
    </Link>
  );
}

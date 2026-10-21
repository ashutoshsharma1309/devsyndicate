import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/shell/page-header";
import { OrgTypeBadge, StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { formatDate } from "@/lib/utils";
import { orgTypes, type OrgType } from "@/lib/validation/lead";

export const metadata = { title: "Organisations" };

/** The leads list narrowed to one organisation (exact organisationKey match). */
const leadsOf = (key: string) => `/admin/leads?org=${encodeURIComponent(key)}`;

const rowLink =
  "min-w-0 break-words font-medium after:absolute after:inset-0 after:content-[''] hover:text-signal focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-signal";

const isOrgFilter = (v: string): v is OrgType | "unknown" => v === "unknown" || orgTypes.some((o) => o.value === v);

export default async function OrganisationsPage({ searchParams }: PageProps<"/admin/organisations">) {
  await requireAdmin();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).slice(0, 100);
  const type = one(sp.type);
  const filters = { q: q || undefined, orgType: isOrgFilter(type) ? type : undefined };

  const store = await getLeadStore();
  const orgs = store ? await store.organisations(filters) : [];
  const filtered = Boolean(filters.q || filters.orgType);

  return (
    <div>
      <AdminPageHeader
        title="Organisations"
        description={
          <>
            Enquiries grouped by institution, so repeat requests read as one relationship. Spellings that differ only in
            case, spacing or punctuation are grouped together.
          </>
        }
        meta={
          <span className="tabular-nums">
            {orgs.length} {orgs.length === 1 ? "organisation" : "organisations"}
            {filtered && (orgs.length === 1 ? " matches these filters" : " match these filters")}
          </span>
        }
      />

      {/* Keyed so "Clear" (a same-route navigation) remounts the controls with the current filters. */}
      <form
        key={`${q}|${filters.orgType ?? ""}`}
        role="search"
        aria-label="Filter organisations"
        className="grid gap-3 md:grid-cols-[1fr_14rem_auto_auto]"
      >
        <label htmlFor="q" className="sr-only">
          Search organisations
        </label>
        <Input id="q" name="q" type="search" defaultValue={q} placeholder="Search name or city…" />
        <label htmlFor="type" className="sr-only">
          Organisation type
        </label>
        <Select id="type" name="type" defaultValue={filters.orgType ?? ""}>
          <option value="">All types</option>
          {orgTypes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value="unknown">Not recorded</option>
        </Select>
        <Button type="submit" variant="secondary" className="h-12">
          Apply
        </Button>
        {filtered && (
          <Link href="/admin/organisations" className="inline-flex h-12 items-center px-2 text-sm text-mute hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {orgs.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-line px-6 py-12 text-center text-sm text-mute">
          {filtered ? "No organisations match these filters." : "No requests yet."}
        </p>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-md border border-line bg-white lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Organisations, most recent enquiry first</caption>
              <thead className="border-b border-line bg-paper/60">
                <tr className="t-label text-mute">
                  <th scope="col" className="px-4 py-3 font-normal">Organisation</th>
                  <th scope="col" className="px-4 py-3 font-normal">Type</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">Enquiries</th>
                  <th scope="col" className="px-4 py-3 font-normal">First contact</th>
                  <th scope="col" className="px-4 py-3 font-normal">Last contact</th>
                  <th scope="col" className="px-4 py-3 font-normal">Latest status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orgs.map((o) => (
                  <tr key={o.key} className="group relative transition-colors duration-150 hover:bg-paper/60">
                    <td className="max-w-[22rem] px-4 py-3.5 align-top">
                      {/* Exactly this organisation's leads, whatever the spelling; the whole row is the link. */}
                      <Link href={leadsOf(o.key)} className={rowLink}>
                        {o.name}
                        <span className="sr-only">: view {o.leadCount === 1 ? "its lead" : `its ${o.leadCount} leads`}</span>
                      </Link>
                      <div className="mt-0.5 text-mute">{o.cities.length > 0 ? o.cities.join(", ") : "—"}</div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <OrgTypeBadge orgType={o.orgType} showUnknown />
                    </td>
                    <td className="px-4 py-3.5 text-right align-top tabular-nums">{o.leadCount}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-top tabular-nums text-mute">{formatDate(o.firstAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-top tabular-nums text-mute">{formatDate(o.lastAt)}</td>
                    <td className="px-4 py-3.5 align-top">
                      <StatusBadge status={o.latestStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul aria-label="Organisations" className="mt-6 divide-y divide-line overflow-hidden rounded-md border border-line bg-white lg:hidden">
            {orgs.map((o) => (
              <li key={o.key} className="relative px-4 py-4 transition-colors duration-150 hover:bg-paper/60">
                <div className="flex items-start justify-between gap-3">
                  <Link href={leadsOf(o.key)} className={rowLink}>
                    {o.name}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums text-mute">
                    {o.leadCount} {o.leadCount === 1 ? "enquiry" : "enquiries"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={o.latestStatus} />
                  <OrgTypeBadge orgType={o.orgType} showUnknown />
                </div>
                <p className="mt-2 text-sm text-mute">
                  {o.cities.length > 0 && <>{o.cities.join(", ")} · </>}
                  Last contact {formatDate(o.lastAt)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

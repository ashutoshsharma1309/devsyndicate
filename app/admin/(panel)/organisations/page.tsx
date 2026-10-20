import Link from "next/link";
import { OrgTypeBadge, StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { formatDate } from "@/lib/utils";
import { orgTypes, type OrgType } from "@/lib/validation/lead";

export const metadata = { title: "Organisations" };

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
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl font-medium tracking-[-0.035em]">Organisations</h1>
        <p className="text-sm tabular-nums text-mute" aria-live="polite">
          {orgs.length} {orgs.length === 1 ? "organisation" : "organisations"}
          {filtered && " match these filters"}
        </p>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-mute">
        Enquiries grouped by institution, so repeat requests read as one relationship. Spellings that differ only in
        case, spacing or punctuation are grouped together.
      </p>

      <form role="search" className="mt-6 grid gap-3 md:grid-cols-[1fr_14rem_auto_auto]">
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
        <p className="mt-8 rounded-md border border-dashed border-line p-10 text-center text-sm text-mute">
          {filtered ? "No organisations match these filters." : "No requests yet."}
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-md border border-line bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line bg-paper/60">
              <tr className="t-label text-mute">
                <th scope="col" className="px-5 py-3 font-normal">Organisation</th>
                <th scope="col" className="px-5 py-3 font-normal">Type</th>
                <th scope="col" className="px-5 py-3 text-right font-normal">Enquiries</th>
                <th scope="col" className="px-5 py-3 font-normal">First contact</th>
                <th scope="col" className="px-5 py-3 font-normal">Last contact</th>
                <th scope="col" className="px-5 py-3 font-normal">Latest status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgs.map((o) => (
                <tr key={o.key} className="group relative hover:bg-paper/60">
                  <td className="px-5 py-4 align-top">
                    {/* The leads search matches this spelling; the whole row is the link. */}
                    <Link
                      href={`/admin/leads?q=${encodeURIComponent(o.name)}`}
                      className="font-medium after:absolute after:inset-0 after:content-[''] group-hover:text-signal"
                    >
                      {o.name}
                    </Link>
                    <div className="mt-0.5 text-mute">{o.cities.length > 0 ? o.cities.join(", ") : "—"}</div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <OrgTypeBadge orgType={o.orgType} showUnknown />
                  </td>
                  <td className="px-5 py-4 text-right align-top tabular-nums">{o.leadCount}</td>
                  <td className="whitespace-nowrap px-5 py-4 align-top tabular-nums text-mute">{formatDate(o.firstAt)}</td>
                  <td className="whitespace-nowrap px-5 py-4 align-top tabular-nums text-mute">{formatDate(o.lastAt)}</td>
                  <td className="px-5 py-4 align-top">
                    <StatusBadge status={o.latestStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

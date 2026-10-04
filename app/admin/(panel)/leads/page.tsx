import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { isLeadStatus, leadStatuses } from "@/lib/leads/types";
import { formatDate } from "@/lib/utils";
import { eventFormats, eventTypes, labelFor, participantRanges } from "@/lib/validation/lead";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireAdmin();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).slice(0, 100);
  const status = one(sp.status);
  const type = one(sp.type);
  const filters = {
    q: q || undefined,
    status: isLeadStatus(status) ? status : undefined,
    eventType: eventTypes.some((t) => t.value === type) ? type : undefined,
  };

  const store = await getLeadStore();
  const leads = store ? await store.list(filters) : [];
  const filtered = Boolean(filters.q || filters.status || filters.eventType);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl font-medium tracking-[-0.035em]">Leads</h1>
        <p className="text-sm tabular-nums text-mute" aria-live="polite">
          {leads.length} {leads.length === 1 ? "request" : "requests"}
          {filtered && " match these filters"}
        </p>
      </div>

      <form role="search" className="mt-6 grid gap-3 md:grid-cols-[1fr_12rem_12rem_auto_auto]">
        <label htmlFor="q" className="sr-only">
          Search leads
        </label>
        <Input id="q" name="q" type="search" defaultValue={q} placeholder="Search institution, name, email, city…" />
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <Select id="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">All statuses</option>
          {leadStatuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <label htmlFor="type" className="sr-only">
          Event type
        </label>
        <Select id="type" name="type" defaultValue={filters.eventType ?? ""}>
          <option value="">All event types</option>
          {eventTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary" className="h-12">
          Apply
        </Button>
        {filtered && (
          <Link href="/admin/leads" className="inline-flex h-12 items-center px-2 text-sm text-mute hover:text-ink">
            Clear
          </Link>
        )}
      </form>

      {leads.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed border-line p-10 text-center text-sm text-mute">
          {filtered ? "No leads match these filters." : "No requests yet."}
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
                    <div className="mt-0.5 text-mute">
                      {l.city}, {l.state}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div>{l.name}</div>
                    <div className="mt-0.5 text-mute">{l.designation}</div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div>{labelFor(eventTypes, l.eventType)}</div>
                    <div className="mt-0.5 text-mute">
                      {labelFor(participantRanges, l.participants)} · {labelFor(eventFormats, l.format)}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <StatusBadge status={l.status} />
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
    </div>
  );
}

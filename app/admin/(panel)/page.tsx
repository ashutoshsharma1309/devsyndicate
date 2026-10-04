import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { leadStatuses } from "@/lib/leads/types";
import { formatDate } from "@/lib/utils";
import { eventTypes, labelFor } from "@/lib/validation/lead";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const store = await getLeadStore();
  const [counts, recent] = store ? await Promise.all([store.countByStatus(), store.list()]) : [null, []];
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const open = counts ? total - counts.won - counts.lost : 0;

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-[-0.035em]">Overview</h1>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
        {[
          ["Total requests", total],
          ["Open pipeline", open],
          ["Won", counts?.won ?? 0],
        ].map(([k, v]) => (
          <div key={k} className="bg-white p-5">
            <dt className="t-label text-mute">{k}</dt>
            <dd className="mt-2 text-3xl font-medium tabular-nums tracking-[-0.03em]">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 text-lg font-medium tracking-[-0.02em]">Pipeline</h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {leadStatuses.map((s) => (
          <li key={s.value}>
            <Link
              href={`/admin/leads?status=${s.value}`}
              className="block rounded-md border border-line bg-white p-4 transition-colors hover:border-ink/30"
            >
              <StatusBadge status={s.value} />
              <span className="mt-3 block text-2xl font-medium tabular-nums">{counts?.[s.value] ?? 0}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex items-baseline justify-between">
        <h2 className="text-lg font-medium tracking-[-0.02em]">Latest requests</h2>
        <Link href="/admin/leads" className="text-sm text-signal hover:underline">
          All leads →
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-line p-8 text-center text-sm text-mute">
          No requests yet. New submissions from the contact form appear here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-md border border-line bg-white">
          {recent.slice(0, 6).map((l) => (
            <li key={l.id}>
              <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-paper">
                <span className="min-w-0 flex-1 truncate font-medium">{l.institution}</span>
                <span className="text-sm text-mute">{labelFor(eventTypes, l.eventType)}</span>
                <StatusBadge status={l.status} />
                <span className="w-28 text-right text-sm tabular-nums text-mute">{formatDate(l.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

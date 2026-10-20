import Link from "next/link";
import { BarList, ChartCard, MonthlyBars, SplitBar } from "@/components/admin/charts";
import { OrgTypeBadge, orgTypeFill, StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getMailer } from "@/lib/email";
import { getLeadStore } from "@/lib/leads/store";
import {
  last12Months,
  leadStatuses,
  zeroByEventType,
  zeroByOrgType,
  zeroByStatus,
  type Lead,
  type LeadStats,
} from "@/lib/leads/types";
import { formatDate } from "@/lib/utils";
import { allEventTypes, labelFor, orgTypes } from "@/lib/validation/lead";

export const metadata = { title: "Overview" };

const orgSplitLabel = { college: "Colleges", company: "Companies", other: "Other organisations", unknown: "Not recorded" };

/** What the page shows without a store: the same layout, all zeros. */
const emptyStats = (): LeadStats => ({
  total: 0,
  last30Days: 0,
  byStatus: zeroByStatus(),
  byOrgType: zeroByOrgType(),
  byEventType: zeroByEventType(),
  byMonth: last12Months().map((month) => ({ month, count: 0 })),
  won: 0,
  lost: 0,
  notifyFailed: 0,
});

export default async function AdminOverviewPage() {
  const session = await requireAdmin();
  const store = await getLeadStore();
  const [stats, latest, mailer] = await Promise.all([
    store?.stats() ?? emptyStats(),
    store ? store.list({ pageSize: 8 }).then((p) => p.leads) : ([] as Lead[]),
    getMailer(),
  ]);
  // Only fetched when there is something to list; stats() already has the count.
  const failed =
    store && stats.notifyFailed > 0 ? (await store.listAll()).filter((l) => l.notifyStatus === "failed") : [];

  const decided = stats.won + stats.lost;
  const winRate = decided > 0 ? `${Math.round((stats.won / decided) * 100)}%` : "—";
  const kpis: { label: string; value: string | number; hint?: string }[] = [
    { label: "Total requests", value: stats.total },
    { label: "Last 30 days", value: stats.last30Days },
    { label: "Colleges", value: stats.byOrgType.college },
    { label: "Companies", value: stats.byOrgType.company },
    { label: "Won", value: stats.won },
    { label: "Win rate", value: winRate, hint: decided > 0 ? `of ${decided} decided` : "none decided yet" },
  ];

  const orgKeys = [...orgTypes.map((o) => o.value), "unknown"] as const;
  const eventItems = Object.entries(stats.byEventType)
    .map(([key, value], i) => ({ key, value, i, label: labelFor(allEventTypes, key) }))
    // Biggest first; ties keep the form's order so the list doesn't reshuffle at random.
    .sort((a, b) => b.value - a.value || a.i - b.i);

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-[-0.035em]">Overview</h1>

      {session.isOwner && (
        <div className="mt-6 rounded-md border border-signal/25 bg-signal/5 p-4 text-sm text-ink">
          <p>
            You&apos;re signed in with the shared password. Add named admin accounts under{" "}
            <Link href="/admin/team" className="font-medium text-signal-deep underline underline-offset-4 hover:text-ink">
              Team
            </Link>{" "}
            so actions are attributed to people.
          </p>
        </div>
      )}

      {/* getMailer() is null only in production without SMTP settings. */}
      {!mailer && (
        <div role="alert" className="mt-6 rounded-md border border-danger/25 bg-danger/5 p-4 text-sm text-danger">
          <p className="font-medium">Email notifications are off.</p>
          <p className="mt-1">
            No mail server is configured, so nobody is emailed about new requests. Set{" "}
            <code className="font-mono">SMTP_HOST</code> and the other <code className="font-mono">SMTP_*</code>{" "}
            variables{store ? ", and check this page for new leads until then." : "."}
          </p>
        </div>
      )}

      {failed.length > 0 && (
        <div role="alert" className="mt-6 rounded-md border border-amber-600/25 bg-amber-500/10 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {failed.length === 1
              ? "1 request's notification email couldn't be sent."
              : `${failed.length} requests' notification emails couldn't be sent.`}
          </p>
          <p className="mt-1">They&apos;re saved here, but nobody was emailed. Follow up on them directly:</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {failed.slice(0, 8).map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="underline underline-offset-4 hover:text-ink">
                  {l.institution}
                </Link>
              </li>
            ))}
            {failed.length > 8 && <li>and {failed.length - 8} more (marked “Email failed” in Leads)</li>}
          </ul>
        </div>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white p-5">
            <dt className="t-label text-mute">{k.label}</dt>
            <dd className="mt-2 text-3xl font-medium tabular-nums tracking-[-0.03em]">{k.value}</dd>
            {k.hint && <dd className="mt-1 text-xs text-mute">{k.hint}</dd>}
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Enquiries per month"
          description="The last 12 months, India time."
          className="lg:col-span-2"
        >
          <MonthlyBars data={stats.byMonth} />
        </ChartCard>
        <ChartCard title="Who’s approaching" description="Every request by organisation type.">
          <SplitBar
            label="Requests by organisation type"
            segments={orgKeys.map((k) => ({
              key: k,
              label: orgSplitLabel[k],
              value: stats.byOrgType[k],
              fill: orgTypeFill[k],
            }))}
          />
          {stats.byOrgType.unknown > 0 && (
            <p className="mt-4 text-xs text-mute">“Not recorded”: sent before the form asked for it.</p>
          )}
        </ChartCard>
        <ChartCard title="By enquiry type" description="Every request by what it was about.">
          <BarList label="Requests by enquiry type" items={eventItems} />
        </ChartCard>
      </div>

      <h2 className="mt-12 text-lg font-medium tracking-[-0.02em]">Pipeline</h2>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {leadStatuses.map((s) => (
          <li key={s.value}>
            <Link
              href={`/admin/leads?status=${s.value}`}
              className="block rounded-md border border-line bg-white p-4 transition-colors hover:border-ink/30"
            >
              <StatusBadge status={s.value} />
              <span className="mt-3 block text-2xl font-medium tabular-nums">{stats.byStatus[s.value]}</span>
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
      {latest.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-line p-8 text-center text-sm text-mute">
          No requests yet. New submissions from the contact form appear here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-md border border-line bg-white">
          {latest.map((l) => (
            <li key={l.id}>
              <Link href={`/admin/leads/${l.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-paper">
                <span className="min-w-0 flex-1 basis-48 truncate font-medium">{l.institution}</span>
                <OrgTypeBadge orgType={l.orgType} />
                <span className="text-sm text-mute">{labelFor(allEventTypes, l.eventType)}</span>
                <StatusBadge status={l.status} />
                <span className="text-sm tabular-nums text-mute sm:w-28 sm:text-right">{formatDate(l.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

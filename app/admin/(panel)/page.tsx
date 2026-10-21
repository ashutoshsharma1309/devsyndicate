import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChartCard, MonthlyBars, SplitBar } from "@/components/admin/charts";
import { ActivityFeed } from "@/components/admin/shell/activity";
import { AdminPageHeader } from "@/components/admin/shell/page-header";
import { AdminPanel } from "@/components/admin/shell/panel";
import { SystemIssues } from "@/components/admin/shell/system-issues";
import { configIssues, contentSections, draftIssue, notificationIssue, sortIssues } from "@/components/admin/shell/system-status";
import { orgTypeFill, StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { emptyLeadStats, leadStatuses, type ActivityEntry, type Lead } from "@/lib/leads/types";
import { cn, formatDate } from "@/lib/utils";
import { allEventTypes, labelFor, orgTypes } from "@/lib/validation/lead";

export const metadata = { title: "Overview" };

const orgSplitLabel = { college: "Colleges", company: "Companies", other: "Other organisations", unknown: "Not recorded" };

const RECENT_LEADS = 8;
const RECENT_ACTIVITY = 10;

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

export default async function AdminOverviewPage() {
  await requireAdmin();
  const store = await getLeadStore();
  const [stats, latest, activity, sections] = await Promise.all([
    store ? store.stats() : emptyLeadStats(),
    store ? store.list({ pageSize: RECENT_LEADS }).then((p) => p.leads) : ([] as Lead[]),
    store ? store.activity({ limit: RECENT_ACTIVITY }) : ([] as ActivityEntry[]),
    contentSections(),
  ]);
  // Only leads that still exist get a link from the activity feed.
  const leadIds = [...new Set(activity.map((e) => e.leadId).filter((id): id is string => Boolean(id)))];
  const liveLeadIds = store && leadIds.length > 0 ? await store.existingLeadIds(leadIds) : new Set<string>();
  const sectionHrefs = Object.fromEntries(sections.map((s) => [s.label, s.adminHref]));

  const issues = sortIssues([
    ...configIssues({ hasStore: Boolean(store) }),
    notificationIssue(stats),
    draftIssue(sections),
  ]);

  const decided = stats.won + stats.lost;
  const tiles: { label: string; value: number; href: string; hint?: string; attention?: boolean }[] = [
    { label: "Total Leads", value: stats.total, href: "/admin/leads", hint: `${stats.last30Days} in the last 30 days` },
    { label: "New Leads", value: stats.newLeads, href: "/admin/leads?status=new", hint: "Not contacted yet" },
    { label: "Open Opportunities", value: stats.open, href: "/admin/leads?open=1", hint: "Not won or lost" },
    { label: "Meetings Scheduled", value: stats.meetings, href: "/admin/leads?status=meeting" },
    { label: "Proposals Sent", value: stats.proposals, href: "/admin/leads?status=proposal" },
    {
      label: "Won Deals",
      value: stats.won,
      href: "/admin/leads?status=won",
      hint: decided > 0 ? `${pct(stats.won, decided)}% of ${decided} decided` : "None decided yet",
    },
  ];
  if (stats.followUpsDue > 0) {
    tiles.push({
      label: "Follow-ups due",
      value: stats.followUpsDue,
      href: "/admin/leads?followUpDue=1",
      hint: "Today or earlier",
      attention: true,
    });
  }

  const orgKeys = [...orgTypes.map((o) => o.value), "unknown"] as const;

  return (
    <div>
      <AdminPageHeader
        title="Workspace Overview"
        description="Manage enquiries, track opportunities, and keep the Dev Syndicate website up to date."
      />

      <section aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="sr-only">
          Key numbers
        </h2>
        <ul
          className={cn(
            "grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3",
            tiles.length === 7 ? "xl:grid-cols-7" : "xl:grid-cols-6",
          )}
        >
          {tiles.map((t, i) => (
            // A seventh tile spans the leftover row, so no empty cell shows below xl.
            <li
              key={t.label}
              className={cn("flex", i === 6 && "col-span-2 sm:col-span-3 xl:col-span-1")}
            >
              <Link
                href={t.href}
                className="group flex w-full flex-col bg-white p-4 transition-colors duration-150 hover:bg-paper sm:p-5"
              >
                <span className={cn("t-label", t.attention ? "text-danger" : "text-mute")}>{t.label}</span>
                <span className="mt-2 text-[1.75rem] font-medium leading-none tabular-nums tracking-[-0.03em]">
                  {t.value}
                </span>
                {t.hint && <span className="mt-2 text-xs text-mute">{t.hint}</span>}
                <span className="sr-only">. View these leads</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <AdminPanel
          id="pipeline"
          title="Pipeline"
          description={`${stats.total} ${stats.total === 1 ? "lead" : "leads"} by stage`}
          className="lg:col-span-2"
          flush
          action={
            <Link href="/admin/leads?open=1" className="text-signal underline-offset-4 hover:underline">
              Open leads
            </Link>
          }
        >
          <ul>
            {leadStatuses.map((s) => {
              const count = stats.byStatus[s.value];
              const share = pct(count, stats.total);
              return (
                <li key={s.value} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/admin/leads?status=${s.value}`}
                    className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-4 px-5 py-2.5 transition-colors duration-150 hover:bg-paper"
                  >
                    <StatusBadge status={s.value} className="justify-self-start" />
                    <span aria-hidden="true" className="block h-1.5 rounded-full bg-paper-2">
                      {count > 0 && (
                        <span className="block h-full min-w-1 rounded-full bg-ink/60" style={{ width: `${share}%` }} />
                      )}
                    </span>
                    <span className="w-20 text-right text-sm tabular-nums">
                      <span className="font-medium">{count}</span>
                      <span className="text-mute"> · {share}%</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </AdminPanel>

        <AdminPanel id="status" title="System status" flush>
          <SystemIssues issues={issues} emptyText="Nothing needs attention. Email, storage and sign-in are configured." />
          {issues.length > 0 && (
            <p className="border-t border-line px-5 py-3 text-sm">
              <Link href="/admin/settings/system" className="text-signal underline-offset-4 hover:underline">
                System details
              </Link>
            </p>
          )}
        </AdminPanel>
      </div>

      <AdminPanel
        id="recent-leads"
        title="Recent leads"
        className="mt-6"
        flush
        action={
          <Link href="/admin/leads" className="inline-flex items-center gap-1 text-signal underline-offset-4 hover:underline">
            View all leads
            <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
          </Link>
        }
      >
        {latest.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-mute">
            No enquiries yet. New submissions from the contact form appear here.
          </p>
        ) : (
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <caption className="sr-only">The {latest.length} most recent leads, newest first</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="t-label px-5 py-2.5 font-normal text-mute">
                  Institution
                </th>
                <th scope="col" className="t-label hidden px-3 py-2.5 font-normal text-mute md:table-cell">
                  Contact
                </th>
                <th scope="col" className="t-label hidden px-3 py-2.5 font-normal text-mute lg:table-cell">
                  Enquiry type
                </th>
                <th scope="col" className="t-label w-36 px-3 py-2.5 font-normal text-mute sm:w-44">
                  Status
                </th>
                <th scope="col" className="t-label hidden w-32 px-3 py-2.5 font-normal text-mute sm:table-cell">
                  Received
                </th>
                <th scope="col" className="t-label hidden w-36 px-5 py-2.5 pl-3 font-normal text-mute lg:table-cell">
                  Last updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {latest.map((l) => (
                <tr key={l.id} className="align-top transition-colors duration-150 hover:bg-paper">
                  <th scope="row" className="px-5 py-3 font-normal">
                    <Link
                      href={`/admin/leads/${l.id}`}
                      className="block break-words font-medium underline-offset-4 hover:underline"
                    >
                      {l.institution}
                    </Link>
                    <span className="mt-0.5 block truncate text-xs text-mute md:hidden">{l.name}</span>
                  </th>
                  <td className="hidden truncate px-3 py-3 md:table-cell">{l.name}</td>
                  <td className="hidden px-3 py-3 text-mute lg:table-cell">{labelFor(allEventTypes, l.eventType)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="hidden px-3 py-3 tabular-nums text-mute sm:table-cell">
                    <time dateTime={l.createdAt}>{formatDate(l.createdAt)}</time>
                  </td>
                  <td className="hidden py-3 pl-3 pr-5 tabular-nums text-mute lg:table-cell">
                    <time dateTime={l.updatedAt}>{formatDate(l.updatedAt)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminPanel>


      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        <AdminPanel
          id="recent-activity"
          title="Recent activity"
          flush
          action={
            <Link href="/admin/activity" className="text-signal underline-offset-4 hover:underline">
              Activity log
            </Link>
          }
        >
          {activity.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-mute">
              No activity yet. Sign-ins, lead updates and content changes appear here.
            </p>
          ) : (
            <ActivityFeed entries={activity} liveLeadIds={liveLeadIds} sectionHrefs={sectionHrefs} />
          )}
        </AdminPanel>
        <div className="grid gap-6 lg:col-span-2">
          <ChartCard title="Enquiries per month" description="The last 12 months, India time.">
            <MonthlyBars data={stats.byMonth} noun="enquiry" nounPlural="enquiries" />
          </ChartCard>
          <ChartCard title="Colleges and companies" description="Every enquiry by organisation type.">
            <SplitBar
              label="Enquiries by organisation type"
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
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getMailer } from "@/lib/email";
import { getLeadStore } from "@/lib/leads/store";
import { leadStatuses } from "@/lib/leads/types";
import { formatDate } from "@/lib/utils";
import { allEventTypes, labelFor } from "@/lib/validation/lead";

export const metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const store = await getLeadStore();
  const [counts, recent, mailer] = await Promise.all([
    store?.countByStatus() ?? null,
    store?.list() ?? [],
    getMailer(),
  ]);
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const open = counts ? total - counts.won - counts.lost : 0;
  // list() returns the latest 500, which covers every lead at current volumes.
  const failed = recent.filter((l) => l.notifyStatus === "failed");

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-[-0.035em]">Overview</h1>

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
                <span className="text-sm text-mute">{labelFor(allEventTypes, l.eventType)}</span>
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

import Link from "next/link";
import { AdminPanel } from "@/components/admin/shell/panel";
import { SystemIssues } from "@/components/admin/shell/system-issues";
import { configIssues, contentSections, draftIssue, notificationIssue, sortIssues } from "@/components/admin/shell/system-status";
import { ownerPasswordConfigured, requireAdmin } from "@/lib/auth/admin";
import { sessionConfigured } from "@/lib/auth/session";
import { getNotificationAddress } from "@/lib/cms";
import { getLeadStore } from "@/lib/leads/store";
import { emptyLeadStats } from "@/lib/leads/types";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "System settings" };

/**
 * How this server is configured. Only whether a setting is present is shown,
 * never a secret's value.
 */
export default async function SystemSettingsPage() {
  await requireAdmin();
  const store = await getLeadStore();
  const prod = process.env.NODE_ENV === "production";
  const [stats, sections, recipient] = await Promise.all([
    store ? store.stats() : emptyLeadStats(),
    contentSections(),
    getNotificationAddress().catch(() => null),
  ]);
  const issues = sortIssues([...configIssues({ hasStore: Boolean(store) }), notificationIssue(stats), draftIssue(sections)]);

  const storage =
    store?.kind === "postgres"
      ? "Postgres (DATABASE_URL)"
      : store?.kind === "file"
        ? "JSON file in .data/ (development only)"
        : "Not configured: enquiries are only emailed";
  const email = process.env.SMTP_HOST
    ? "SMTP (SMTP_HOST is set)"
    : prod
      ? "Not configured: no emails are sent"
      : "Printed to the server log (development)";
  const primaryAdmin = ownerPasswordConfigured()
    ? process.env.ADMIN_PASSWORD_HASH
      ? "Configured (ADMIN_USERNAME and ADMIN_PASSWORD_HASH)"
      : "Configured with a plain-text ADMIN_PASSWORD (replace it with ADMIN_PASSWORD_HASH)"
    : "Not configured";

  const config: [string, string][] = [
    ["Environment", prod ? "Production" : "Development"],
    ["Lead storage", storage],
    ["Email delivery", email],
    ["Lead notifications go to", recipient ?? "Couldn't be read"],
    ["Session signing", sessionConfigured() ? "Configured (SESSION_SECRET)" : "Not configured"],
    ["Primary admin", primaryAdmin],
  ];

  return (
    <div className="grid max-w-4xl gap-6">
      <AdminPanel id="issues" title="Needs attention" flush>
        <SystemIssues issues={issues} emptyText="Nothing needs attention." />
      </AdminPanel>

      <AdminPanel id="config" title="Configuration" description="Set in the server environment. Secret values are never shown." flush>
        <dl className="divide-y divide-line">
          {config.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[13rem_1fr] sm:gap-4">
              <dt className="text-mute">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-mute">
          The notification address is the contact form&apos;s published recipient, else CONTACT_EMAIL, else the
          published company email.
        </p>
      </AdminPanel>

      <AdminPanel
        id="content"
        title="Website content"
        description="What is live on each part of the website."
        flush
        action={
          <Link href="/admin/content" className="text-signal underline-offset-4 hover:underline">
            Content Management
          </Link>
        }
      >
        {sections.length === 0 ? (
          <p className="px-5 py-6 text-sm text-mute">Content sections couldn&apos;t be read.</p>
        ) : (
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <caption className="sr-only">Website content sections and their publish state</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="t-label px-5 py-2.5 font-normal text-mute">
                  Section
                </th>
                <th scope="col" className="t-label hidden px-3 py-2.5 font-normal text-mute sm:table-cell">
                  Last published
                </th>
                <th scope="col" className="t-label w-36 px-5 py-2.5 pl-3 font-normal text-mute sm:w-44">
                  Draft
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sections.map((s) => {
                const published = s.publishedAt
                  ? `${formatDate(s.publishedAt, true)}${s.publishedBy ? ` by ${s.publishedBy}` : ""}`
                  : "Never (original copy)";
                return (
                  <tr key={s.key} className="align-top">
                    <th scope="row" className="px-5 py-3 font-normal">
                      <Link href={s.adminHref} className="font-medium underline-offset-4 hover:underline">
                        {s.label}
                      </Link>
                      <span className="mt-0.5 block break-words text-xs text-mute sm:hidden">{published}</span>
                    </th>
                    <td className="hidden break-words px-3 py-3 text-mute sm:table-cell">{published}</td>
                    <td className="py-3 pl-3 pr-5">
                      {s.hasUnpublishedChanges ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xs border border-signal/30 bg-signal/8 px-2 py-0.5 text-xs font-medium text-signal-deep">
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-70" />
                          Unpublished changes
                        </span>
                      ) : (
                        <span className="text-mute">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminPanel>
    </div>
  );
}

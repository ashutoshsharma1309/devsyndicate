import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteForm, StatusForm } from "@/components/admin/forms";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { formatDate } from "@/lib/utils";
import { eventFormats, eventTypes, labelFor, participantRanges, timelines } from "@/lib/validation/lead";

export const metadata = { title: "Lead" };

function Block({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <section className="rounded-md border border-line bg-white">
      <h2 className="t-label border-b border-line px-5 py-3 text-mute">{title}</h2>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 px-5 py-3.5 text-sm sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="text-mute">{k}</dt>
            <dd className="break-words">{v || <span className="text-mute">—</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const store = await getLeadStore();
  const result = store ? await store.get(id) : null;
  if (!result) notFound();
  const { lead, notes } = result;

  const link = "text-signal underline-offset-4 hover:underline";

  return (
    <div>
      <Link href="/admin/leads" className="text-sm text-mute hover:text-ink">
        ← All leads
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-[-0.035em]">{lead.institution}</h1>
          <p className="mt-2 text-mute">
            {lead.city}, {lead.state} · received {formatDate(lead.createdAt, true)}
          </p>
        </div>
        <StatusBadge status={lead.status} className="mt-2 text-sm" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Block
            title="Contact"
            rows={[
              ["Name", lead.name],
              ["Designation", lead.designation],
              [
                "Email",
                <a key="e" className={link} href={`mailto:${lead.email}`}>
                  {lead.email}
                </a>,
              ],
              [
                "Phone",
                <a key="p" className={link} href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>
                  {lead.phone}
                </a>,
              ],
            ]}
          />
          <Block
            title="Institution"
            rows={[
              ["Institution", lead.institution],
              ["Location", `${lead.city}, ${lead.state}`],
              [
                "Website",
                lead.website && /^https?:\/\//.test(lead.website) ? (
                  <a key="w" className={link} href={lead.website} target="_blank" rel="noopener noreferrer nofollow">
                    {lead.website}
                  </a>
                ) : (
                  lead.website
                ),
              ],
            ]}
          />
          <Block
            title="Event requirements"
            rows={[
              ["Event type", labelFor(eventTypes, lead.eventType)],
              ["Expected participants", labelFor(participantRanges, lead.participants)],
              ["Format", labelFor(eventFormats, lead.format)],
              ["Timeline", labelFor(timelines, lead.timeline)],
              ["Theme / technology", lead.theme],
              ["Additional requirements", lead.message && <p className="whitespace-pre-wrap">{lead.message}</p>],
              ["Submitted from", lead.source],
            ]}
          />
        </div>

        <div className="space-y-6 lg:col-span-4">
          <section className="rounded-md border border-line bg-white p-5">
            <StatusForm id={lead.id} status={lead.status} />
            <p className="mt-3 text-xs text-mute">Last updated {formatDate(lead.updatedAt, true)}</p>
          </section>

          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-sm font-medium">Notes</h2>
            <div className="mt-3">
              <NoteForm id={lead.id} />
            </div>
            {notes.length > 0 && (
              <ol className="mt-6 space-y-4 border-t border-line pt-5">
                {notes.map((n) => (
                  <li key={n.id}>
                    <p className="t-label text-mute">{formatDate(n.createdAt, true)}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{n.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

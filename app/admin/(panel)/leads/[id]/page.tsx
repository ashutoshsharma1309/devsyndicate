import { notFound } from "next/navigation";
import { ChevronDown, ExternalLink, Mail, Phone, TriangleAlert } from "lucide-react";
import { ActivityList, ContactForm, DeleteLeadForm, NoteForm, StatusForm } from "@/components/admin/forms";
import { FollowUp, formatDay, istTodayLocal } from "@/components/admin/lead-format";
import { PipelineForm } from "@/components/admin/lead-pipeline";
import { AdminPageHeader } from "@/components/admin/shell/page-header";
import { NotifyFailedBadge, OrgTypeBadge, StatusBadge } from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/auth/admin";
import { getLeadStore } from "@/lib/leads/store";
import { formatDate, formatLocation } from "@/lib/utils";
import { allEventTypes, eventFormats, labelFor, orgTypes, participantRanges, timelines } from "@/lib/validation/lead";

export const metadata = { title: "Lead" };

const link = "text-signal underline-offset-4 hover:underline";
const quickLink =
  "inline-flex h-10 items-center gap-2 rounded-sm border border-ink/15 bg-white px-3.5 text-sm font-medium transition-colors duration-150 hover:border-ink/40";

/** Only an absolute http(s) URL becomes a link; anything else is shown as text. */
const safeWebsite = (v: string) => {
  if (!/^https?:\/\//i.test(v) || !URL.canParse(v)) return null;
  const u = new URL(v);
  return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
};

type Row = [label: string, value: React.ReactNode];

function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h3 className="t-label border-b border-line bg-paper/60 px-5 py-2.5 text-mute">{title}</h3>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-mute">{k}</dt>
            <dd className="min-w-0 break-words">{v || <span className="text-mute">Not given</span>}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={`rounded-md border border-line bg-white p-5 ${className ?? ""}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const store = await getLeadStore();
  const [result, history] = store ? await Promise.all([store.get(id), store.activity({ leadId: id })]) : [null, []];
  if (!result) notFound();
  const { lead, notes } = result;

  const website = lead.website ? safeWebsite(lead.website) : null;
  const tel = lead.phone.replace(/[^\d+]/g, "");
  const today = istTodayLocal();
  const lostWithoutReason = lead.status === "lost" && !lead.lossReason;

  return (
    <div>
      <AdminPageHeader
        breadcrumbs={[{ label: "Leads", href: "/admin/leads" }, { label: lead.institution }]}
        title={lead.institution}
        description={
          <>
            Received {formatDate(lead.createdAt, true)} · Updated {formatDate(lead.updatedAt, true)}
          </>
        }
        meta={
          <>
            <StatusBadge status={lead.status} />
            <OrgTypeBadge orgType={lead.orgType} showUnknown />
            {lead.notifyStatus === "failed" && <NotifyFailedBadge />}
          </>
        }
        actions={
          <>
            <a href={`mailto:${lead.email}`} className={quickLink}>
              <Mail aria-hidden="true" className="size-4" />
              Email
              <span className="sr-only"> {lead.name}</span>
            </a>
            {tel && (
              <a href={`tel:${tel}`} className={quickLink}>
                <Phone aria-hidden="true" className="size-4" />
                Call
                <span className="sr-only"> {lead.phone}</span>
              </a>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer nofollow" className={quickLink}>
                <ExternalLink aria-hidden="true" className="size-4" />
                Website
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-12">
        {/* What the enquirer sent. Only contact details can be corrected (privacy: right to correction). */}
        <section aria-labelledby="submitted-heading" className="min-w-0 space-y-4 lg:col-span-7">
          <div>
            <h2 id="submitted-heading" className="t-eyebrow text-ink">
              Submitted by the enquirer
            </h2>
            <p className="mt-2 text-sm text-mute">As sent through the contact form. Contact details can be corrected below.</p>
          </div>
          <div className="overflow-hidden rounded-md border border-line bg-white">
            <Group
              title="Contact"
              rows={[
                ["Name", lead.name],
                ["Designation", lead.designation],
                [
                  "Email",
                  <a key="e" className={`${link} break-all`} href={`mailto:${lead.email}`}>
                    {lead.email}
                  </a>,
                ],
                [
                  "Phone",
                  tel ? (
                    <a key="p" className={link} href={`tel:${tel}`}>
                      {lead.phone}
                    </a>
                  ) : (
                    lead.phone
                  ),
                ],
              ]}
            />
            <Group
              title="Organisation"
              rows={[
                ["Name", lead.institution],
                [
                  "Organisation type",
                  lead.orgType ? (
                    labelFor(orgTypes, lead.orgType)
                  ) : (
                    <span key="o" className="text-mute">
                      Not recorded (received before the form asked)
                    </span>
                  ),
                ],
                ["Location", formatLocation(lead) === "—" ? "" : formatLocation(lead)],
                [
                  "Website",
                  website ? (
                    <a key="w" className={`${link} break-all`} href={website} target="_blank" rel="noopener noreferrer nofollow">
                      {lead.website}
                    </a>
                  ) : (
                    lead.website
                  ),
                ],
              ]}
            />
            <Group
              title="Enquiry"
              rows={[
                ["Enquiry type", labelFor(allEventTypes, lead.eventType)],
                ["Expected participants", lead.participants && labelFor(participantRanges, lead.participants)],
                ["Format", lead.format && labelFor(eventFormats, lead.format)],
                ["Timeline", lead.timeline && labelFor(timelines, lead.timeline)],
                ["Theme / technology", lead.theme],
                ["Requirements", lead.message && <p className="whitespace-pre-wrap">{lead.message}</p>],
              ]}
            />
            <Group
              title="Submission"
              rows={[
                ["Received", formatDate(lead.createdAt, true)],
                ["Source", lead.source],
                [
                  "Team notification",
                  lead.notifyStatus === "failed" ? (
                    <span key="n" className="font-medium text-danger">
                      Failed: follow up from here
                    </span>
                  ) : lead.notifyStatus === "sent" ? (
                    "Sent"
                  ) : (
                    <span key="n" className="text-mute">
                      Not recorded
                    </span>
                  ),
                ],
              ]}
            />
          </div>

          <details className="group rounded-md border border-line bg-white">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-md px-5 py-3 text-sm font-medium hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal [&::-webkit-details-marker]:hidden">
              Edit contact details
              <ChevronDown
                aria-hidden="true"
                className="size-4 text-mute transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <div className="border-t border-line p-5">
              <p className="mb-5 text-sm text-mute">
                Correct details when the person asks (or when they were mistyped). Validated like the contact form.
              </p>
              <ContactForm
                id={lead.id}
                lead={{
                  name: lead.name,
                  designation: lead.designation,
                  email: lead.email,
                  phone: lead.phone,
                  institution: lead.institution,
                  city: lead.city,
                }}
              />
            </div>
          </details>
        </section>

        {/* The team's own record of the lead. Never shown to the enquirer. */}
        <section aria-labelledby="internal-heading" className="min-w-0 space-y-4 lg:col-span-5">
          <div>
            <h2 id="internal-heading" className="t-eyebrow text-ink">
              Internal
            </h2>
            <p className="mt-2 text-sm text-mute">Only admins see this. Dates are India Standard Time.</p>
          </div>

          <div className="rounded-md border border-line bg-paper-2/50 p-1.5">
            <div className="space-y-1.5">
              <section aria-label="Status" className="rounded-sm border border-line bg-white p-5">
                <StatusForm id={lead.id} status={lead.status} />
                <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-mute">Next follow-up</dt>
                  <dd>
                    <FollowUp lead={lead} today={today} emptyLabel="Not set" />
                  </dd>
                  <dt className="text-mute">Last contacted</dt>
                  <dd>{lead.lastContacted ? formatDay(lead.lastContacted) : <span className="text-mute">Not recorded</span>}</dd>
                  <dt className="text-mute">Meeting</dt>
                  <dd>{lead.meetingAt ? formatDate(lead.meetingAt, true) : <span className="text-mute">None scheduled</span>}</dd>
                </dl>
                {lostWithoutReason && (
                  <p className="mt-4 flex items-start gap-2 rounded-sm border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger">
                    <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    Marked Lost with no loss reason. Add one under Pipeline.
                  </p>
                )}
              </section>

              <section aria-labelledby="pipeline-heading" className="rounded-sm border border-line bg-white p-5">
                <h3 id="pipeline-heading" className="text-sm font-medium">
                  Pipeline
                </h3>
                <div className="mt-4">
                  <PipelineForm
                    id={lead.id}
                    status={lead.status}
                    lead={{
                      nextFollowUp: lead.nextFollowUp,
                      lastContacted: lead.lastContacted,
                      meetingAt: lead.meetingAt,
                      proposalDetails: lead.proposalDetails,
                      lossReason: lead.lossReason,
                    }}
                  />
                </div>
              </section>

              <Card title="Notes" className="rounded-sm">
                <NoteForm id={lead.id} />
                {notes.length > 0 ? (
                  <ol className="mt-5 space-y-4 border-t border-line pt-5">
                    {notes.map((n) => (
                      <li key={n.id}>
                        <time dateTime={n.createdAt} className="t-label block text-mute">
                          {formatDate(n.createdAt, true)}
                        </time>
                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed">{n.body}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-mute">No notes yet.</p>
                )}
              </Card>

              <Card title="History" className="rounded-sm">
                {history.length === 0 ? (
                  <p className="text-sm text-mute">No admin activity on this lead yet.</p>
                ) : (
                  <ActivityList entries={history} onLeadPage />
                )}
              </Card>

              <section aria-labelledby="delete-heading" className="rounded-sm border border-danger/20 bg-white p-5">
                <h3 id="delete-heading" className="text-sm font-medium">
                  Delete lead
                </h3>
                <p className="mt-1.5 text-sm text-mute">
                  For deletion requests under the privacy policy. Removes the lead and its notes permanently. The
                  activity log keeps the institution&apos;s name.
                </p>
                <div className="mt-4">
                  <DeleteLeadForm id={lead.id} />
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

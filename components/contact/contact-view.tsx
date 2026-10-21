import { Suspense } from "react";
import { ContactOptions } from "@/components/contact/contact-options";
import { LeadForm, LeadFormWithPreset, Received, type LeadFormSettings } from "@/components/contact/lead-form";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/section";
import { getContactInfo, getFormConfig, type ContactInfo } from "@/lib/cms";

/** Result of a plain (no-JavaScript) form post — see app/api/leads/route.ts. */
export const outcomes = ["sent", "invalid", "error"] as const;
export type Outcome = (typeof outcomes)[number];

const next = [
  { title: "We review your enquiry", body: "We look at your objectives, scale and timeline before we call." },
  { title: "A short conversation", body: "We talk through what you want to achieve and what's realistic." },
  { title: "A clear proposal", body: "Format, timeline, scope and who handles what — in writing." },
];

const inlineLink = "underline decoration-ink/25 underline-offset-4 hover:decoration-signal";

/** Shown instead of the form while the published contact-form settings have it switched off. */
function FormClosed({ contact }: { contact: ContactInfo }) {
  const pc = contact.primaryContact;
  return (
    <div role="note" className="rounded-md border border-line bg-white p-7 md:p-10">
      <p className="t-label text-mute">Form closed</p>
      <p className="mt-4 text-[1.125rem] font-medium tracking-[-0.015em]">
        We&apos;re not taking enquiries through this form at the moment.
      </p>
      <p className="t-body mt-3 max-w-xl text-mute">
        Please reach us directly: call {pc.name} on{" "}
        <a href={pc.phone.href} className={`text-ink ${inlineLink}`}>
          {pc.phone.display}
        </a>{" "}
        or email{" "}
        <a href={`mailto:${contact.email}`} className={`break-all text-ink ${inlineLink}`}>
          {contact.email}
        </a>
        .
      </p>
    </div>
  );
}

/**
 * The /contact page body. `outcome` is set only on the /contact/[outcome]
 * pages, where a plain form post (no JavaScript) lands, so the result is in the
 * server-rendered HTML rather than depending on client code.
 *
 * Contact details, the offered enquiry types, the confirmation message and
 * whether the form is open come from published content.
 */
export async function ContactView({ outcome, children }: { outcome?: Outcome; children?: React.ReactNode }) {
  const [form, contact] = await Promise.all([getFormConfig(), getContactInfo()]);
  const settings: LeadFormSettings = {
    enquiryTypes: form.enquiryTypes,
    confirmationMessage: form.confirmationMessage,
    privacyHref: form.privacyHref,
    contact: { name: contact.primaryContact.name, email: contact.email, phone: contact.primaryContact.phone },
  };
  return (
    <>
      {children}
      <PageHero
        eyebrow="Contact"
        title="Let's plan your college hackathon."
        lead="Tell us about your college, company or organisation and what you have in mind. The Dev Syndicate team can discuss your requirements and the right format for your event."
        below={<ContactOptions tone="dark" formHref={form.enabled ? "#enquiry" : null} />}
      />

      <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-16 bg-paper">
        <Container className="grid gap-16 py-16 md:py-24 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-8">
            <p className="t-eyebrow text-signal">Collaboration enquiry</p>
            <h2 id="enquiry-title" className="mb-10 mt-4 text-[clamp(1.6rem,1.3rem+1vw,2.25rem)] font-medium leading-tight tracking-[-0.03em]">
              Tell us what you&apos;re planning.
            </h2>
            {outcome === "sent" ? (
              <Received settings={settings} />
            ) : !form.enabled ? (
              <FormClosed contact={contact} />
            ) : outcome ? (
              <LeadForm settings={settings} notice={outcome} />
            ) : (
              // The fallback is the full form, so it is in the static HTML; the preset applies once hydrated.
              <Suspense fallback={<LeadForm settings={settings} />}>
                <LeadFormWithPreset settings={settings} />
              </Suspense>
            )}
          </div>

          <aside className="lg:col-span-4" aria-label="What happens next">
            <div className="space-y-8 lg:sticky lg:top-28">
              <div className="rounded-md border border-line bg-white p-6 md:p-7">
                <h2 className="t-label text-mute">What happens next</h2>
                <ol className="mt-6 space-y-6">
                  {next.map((s, i) => (
                    <li key={s.title} className="grid grid-cols-[1.75rem_1fr] gap-3">
                      <span className="font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <p className="font-medium tracking-[-0.01em]">{s.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-mute">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <dl className="space-y-5 border-t border-line pt-6 text-[0.9375rem]">
                <div>
                  <dt className="t-label text-mute">Prefer to talk first?</dt>
                  <dd className="mt-1.5">
                    Call {contact.primaryContact.name} on{" "}
                    <a
                      href={contact.primaryContact.phone.href}
                      className="underline decoration-ink/25 underline-offset-4 hover:decoration-signal"
                    >
                      {contact.primaryContact.phone.display}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="t-label text-mute">Based in</dt>
                  <dd className="mt-1.5">
                    {contact.location.city}, {contact.location.region} — working with institutions across{" "}
                    {contact.location.country}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}

import { Suspense } from "react";
import { ContactOptions } from "@/components/contact/contact-options";
import { LeadForm, LeadFormWithPreset, Received } from "@/components/contact/lead-form";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/section";
import { site } from "@/lib/site";

/** Result of a plain (no-JavaScript) form post — see app/api/leads/route.ts. */
export const outcomes = ["sent", "invalid", "error"] as const;
export type Outcome = (typeof outcomes)[number];

const next = [
  { title: "We review your enquiry", body: "We look at your objectives, scale and timeline before we call." },
  { title: "A short conversation", body: "We talk through what you want to achieve and what's realistic." },
  { title: "A clear proposal", body: "Format, timeline, scope and who handles what — in writing." },
];

/**
 * The /contact page body. `outcome` is set only on the /contact/[outcome]
 * pages, where a plain form post (no JavaScript) lands, so the result is in the
 * server-rendered HTML rather than depending on client code.
 */
export function ContactView({ outcome, children }: { outcome?: Outcome; children?: React.ReactNode }) {
  return (
    <>
      {children}
      <PageHero
        eyebrow="Contact"
        title="Let's plan your college hackathon."
        lead="Tell us about your institution and what you have in mind. The Dev Syndicate team can discuss your requirements and the right format for your event."
        below={<ContactOptions tone="dark" formHref="#enquiry" />}
      />

      <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-16 bg-paper">
        <Container className="grid gap-16 py-16 md:py-24 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-8">
            <p className="t-eyebrow text-signal">Collaboration enquiry</p>
            <h2 id="enquiry-title" className="mb-10 mt-4 text-[clamp(1.6rem,1.3rem+1vw,2.25rem)] font-medium leading-tight tracking-[-0.03em]">
              Tell us what you&apos;re planning.
            </h2>
            {outcome === "sent" ? (
              <Received />
            ) : outcome ? (
              <LeadForm notice={outcome} />
            ) : (
              // The fallback is the full form, so it is in the static HTML; the preset applies once hydrated.
              <Suspense fallback={<LeadForm />}>
                <LeadFormWithPreset />
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
                    Call {site.primaryContact.name} on{" "}
                    <a
                      href={site.primaryContact.phone.href}
                      className="underline decoration-ink/25 underline-offset-4 hover:decoration-signal"
                    >
                      {site.primaryContact.phone.display}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="t-label text-mute">Based in</dt>
                  <dd className="mt-1.5">
                    {site.location.city}, {site.location.region} — working with institutions across{" "}
                    {site.location.country}
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

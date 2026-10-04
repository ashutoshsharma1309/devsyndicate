import { Suspense } from "react";
import { LeadForm, LeadFormWithPreset } from "@/components/contact/lead-form";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/section";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Conduct a Hackathon",
  description:
    "Tell Dev Syndicate about your institution and the hackathon you have in mind. We'll review the details and schedule a quick conversation.",
  path: "/contact",
});

const next = [
  { title: "We review your request", body: "We look at your objectives, scale and timeline before we call." },
  { title: "A short conversation", body: "We talk through what you want to achieve and what's realistic." },
  { title: "A clear proposal", body: "Format, timeline, scope and who handles what — in writing." },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Conduct a hackathon"
        title="Planning a hackathon for your college?"
        lead="Tell us a little about your institution and what you're trying to achieve. We'll review the details and schedule a quick conversation."
      />

      <section aria-label="Hackathon request form" className="bg-paper">
        <Container className="grid gap-16 py-16 md:py-24 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-8">
            <p className="t-eyebrow mb-10 text-signal">Tell us what you&apos;re planning</p>
            {/* The fallback is the full form, so it is in the static HTML; the preset applies once hydrated. */}
            <Suspense fallback={<LeadForm />}>
              <LeadFormWithPreset />
            </Suspense>
          </div>

          <aside className="lg:col-span-4" aria-label="What happens next and other ways to reach us">
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

              <div className="on-dark rounded-md bg-ink p-6 text-white md:p-7">
                <h2 className="text-lg font-medium tracking-[-0.02em]">Prefer email or phone?</h2>
                <p className="mt-2 text-sm text-mute-dark">Reach the team directly.</p>
                <address className="mt-6 space-y-4 not-italic">
                  <a href={`mailto:${site.email}`} className="group block">
                    <span className="t-label block text-mute-dark">Email</span>
                    <span className="mt-1 block break-all text-[0.9375rem] text-white transition-colors group-hover:text-signal-soft">
                      {site.email}
                    </span>
                  </a>
                  <a href={site.phone.href} className="group block">
                    <span className="t-label block text-mute-dark">Phone</span>
                    <span className="mt-1 block text-[0.9375rem] text-white transition-colors group-hover:text-signal-soft">
                      {site.phone.display}
                    </span>
                  </a>
                  <div>
                    <span className="t-label block text-mute-dark">Based in</span>
                    <span className="mt-1 block text-[0.9375rem] text-white/85">
                      {site.location.city}, {site.location.region}, {site.location.country}
                    </span>
                  </div>
                </address>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}

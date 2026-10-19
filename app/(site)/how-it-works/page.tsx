import { PageJsonLd } from "@/components/layout/json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { ProcessSteps } from "@/components/process/process-steps";
import { FinalCta } from "@/components/sections/final-cta";
import { ResponsibilitySplit } from "@/components/sections/responsibility-split";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { pageMetadata, type PageSeo } from "@/lib/seo";

const page: PageSeo = {
  title: "How Hackathon Planning Works",
  breadcrumb: "How It Works",
  description:
    "How a hackathon partnership with Dev Syndicate works — from the first conversation to the post-event report, and exactly what your college and our team each handle.",
  path: "/how-it-works",
};

export const metadata = pageMetadata(page);

const afterContact = [
  { title: "You send a request", body: "A short form about your institution, objectives and the event you have in mind." },
  { title: "We review it", body: "We read through the details and prepare questions before we talk." },
  { title: "A quick call", body: "We discuss goals, audience, dates and constraints — and what's realistic." },
  { title: "A written proposal", body: "Format, timeline, scope, responsibilities and cost, so you can take it for approval." },
];

const windows = [
  {
    label: "Campus hackathon",
    weeks: "6–8",
    body: "Enough time for branding, campus outreach, registrations and a mentor panel.",
  },
  {
    label: "National or industry-led",
    weeks: "10–12",
    body: "Room for wider outreach, industry judges, sponsors and multi-stage screening.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageJsonLd page={page} />
      <PageHero
        eyebrow="How it works"
        title="From conversation to hackathon."
        lead="A clear process, an agreed scope and a written split of responsibilities — so everyone on your side knows exactly what's expected of them, and what isn't."
        aside={
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/[0.09] bg-white/[0.09]">
            {[
              ["Process", "5 steps"],
              ["Your contact", "One, throughout"],
              ["Formats", "Online · Offline · Hybrid"],
              ["Ends with", "A post-event report"],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink/90 p-4">
                <dt className="t-label text-mute-dark">{k}</dt>
                <dd className="mt-2 text-[0.9375rem] text-white">{v}</dd>
              </div>
            ))}
          </dl>
        }
      />

      <Section aria-labelledby="steps-title">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>The process</SectionLabel>
              <SectionHeading id="steps-title" className="mt-6">
                Five steps. Both sides know their part.
              </SectionHeading>
            </div>
            <p className="t-lead text-mute lg:col-span-5">
              Each step lists what we need from your college and what you get from us. Most of the work sits on our
              side.
            </p>
          </div>
          <div className="mt-14 md:mt-20">
            <ProcessSteps variant="detailed" />
          </div>
        </Container>
      </Section>

      <ResponsibilitySplit />

      <Section aria-labelledby="first-title">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionLabel>Getting started</SectionLabel>
              <SectionHeading id="first-title" className="mt-6">
                What happens after you get in touch.
              </SectionHeading>
              <p className="t-lead mt-6 text-mute">
                No commitment until you&apos;ve seen a proposal and taken it through your internal approvals.
              </p>
              <ButtonLink href="/contact" size="lg" arrow className="mt-10">
                Plan Your Hackathon
              </ButtonLink>
            </div>
            <ol className="grid gap-px self-start overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:col-span-7">
              {afterContact.map((s, i) => (
                <li key={s.title} data-reveal style={{ ["--reveal-i" as string]: i }} className="bg-paper p-6 md:p-8">
                  <p className="font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-5 text-[1.1875rem] font-medium tracking-[-0.02em]">{s.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-mute">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section tone="muted" aria-labelledby="timing-title">
        <Container>
          <div className="max-w-3xl">
            <SectionLabel>Timing</SectionLabel>
            <SectionHeading id="timing-title" className="mt-6">
              How early to start.
            </SectionHeading>
            <p className="t-lead mt-6 text-mute">
              Our recommended planning windows. Shorter timelines can sometimes work — share your dates and we&apos;ll
              tell you honestly what&apos;s feasible.
            </p>
          </div>
          <ul className="mt-14 grid gap-4 md:grid-cols-2">
            {windows.map((w, i) => (
              <li
                key={w.label}
                data-reveal
                style={{ ["--reveal-i" as string]: i }}
                className="flex flex-col rounded-md border border-line bg-paper p-7 md:p-10"
              >
                <p className="t-label text-mute">{w.label}</p>
                <p className="mt-8 text-[clamp(3rem,2rem+3vw,4.5rem)] font-medium leading-none tracking-[-0.05em]">
                  {w.weeks}
                  <span className="ml-3 text-xl font-normal tracking-[-0.02em] text-mute">weeks before</span>
                </p>
                <p className="t-body mt-6 max-w-sm text-mute">{w.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}

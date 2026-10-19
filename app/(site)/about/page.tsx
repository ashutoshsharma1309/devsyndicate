import { PageJsonLd } from "@/components/layout/json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { FinalCta } from "@/components/sections/final-cta";
import { TeamSection } from "@/components/sections/team";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { audiences, principles } from "@/lib/content";
import { pageMetadata, type PageSeo } from "@/lib/seo";
import { site } from "@/lib/site";

const page: PageSeo = {
  title: "About Dev Syndicate | Hackathon Partner for Colleges",
  absoluteTitle: true,
  breadcrumb: "About",
  description:
    "Meet Dev Syndicate, a Bengaluru-based hackathon partner for colleges led by Shiven Kumar and Ashutosh Sharma — why we exist, how we work and who we work with.",
  path: "/about",
};

export const metadata = pageMetadata(page);

export default function AboutPage() {
  return (
    <>
      <PageJsonLd page={page} />
      <PageHero
        eyebrow="About Dev Syndicate"
        title="We run the hackathon. Your college gets the outcome."
        lead="Dev Syndicate is a hackathon partner for colleges and institutions. We plan, promote and run professional, industry-connected hackathons — so the people on your campus can focus on their students."
      />

      <Section aria-labelledby="why-exist-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionLabel>Why we exist</SectionLabel>
              <SectionHeading id="why-exist-title" className="mt-6">
                Three groups that should meet more often.
              </SectionHeading>
            </div>
            <div className="t-lead space-y-6 text-ink/80 lg:col-span-7">
              <p>
                Colleges want events that put their institution on the map and give students real industry exposure.
                Students want challenges that feel serious, not like another form to fill in. Companies want to meet
                people who can actually build.
              </p>
              <p>
                A well-run hackathon serves all three. But running one well takes strategy, outreach, industry
                connections and a lot of operational work — and that usually lands on a few faculty members who
                already have full-time jobs.
              </p>
              <p className="text-ink">
                Dev Syndicate exists to take that work on. One team, accountable from the first planning call to the
                post-event report.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="dark" aria-labelledby="principles-title">
        <Container>
          <div className="max-w-3xl">
            <SectionLabel tone="dark">How we work</SectionLabel>
            <SectionHeading id="principles-title" className="mt-6">
              What we hold ourselves to.
            </SectionHeading>
          </div>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.08] md:mt-20 md:grid-cols-2">
            {principles.map((p, i) => (
              <li key={p.title} data-reveal style={{ ["--reveal-i" as string]: i }} className="bg-ink p-7 md:p-10">
                <p className="font-mono text-sm text-signal-soft">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="t-h3 mt-6">{p.title}</h3>
                <p className="t-body mt-3 max-w-md text-white/65">{p.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section aria-labelledby="audience-title">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>Who we work with</SectionLabel>
              <SectionHeading id="audience-title" className="mt-6">
                Built for institutions. Designed for builders.
              </SectionHeading>
            </div>
          </div>
          <ul className="mt-14 grid gap-10 md:mt-20 md:grid-cols-3 md:gap-8">
            {audiences.map((a, i) => (
              <li key={a.title} data-reveal style={{ ["--reveal-i" as string]: i }} className="border-t border-ink pt-6">
                <p className="t-label text-signal">{a.label}</p>
                <h3 className="t-h3 mt-4">{a.title}</h3>
                <p className="t-body mt-3 text-mute">{a.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <TeamSection tone="muted" />

      <Section aria-labelledby="details-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionLabel>Company details</SectionLabel>
              <SectionHeading id="details-title" className="mt-6">
                Talk to the team directly.
              </SectionHeading>
            </div>
            <dl className="divide-y divide-line border-y border-line lg:col-span-7">
              {[
                ["Company", site.name],
                ["What we do", "Hackathon planning, promotion and execution for colleges and institutions"],
                ["Based in", `${site.location.city}, ${site.location.region}, ${site.location.country}`],
                ["Works with", "Colleges and institutions across India — on campus, online or hybrid"],
                [
                  "Email",
                  <a key="e" href={`mailto:${site.email}`} className="underline decoration-ink/25 underline-offset-4 hover:decoration-signal">
                    {site.email}
                  </a>,
                ],
                [
                  "Primary contact",
                  <span key="c">
                    {site.primaryContact.name}, {site.primaryContact.role} ·{" "}
                    <a
                      href={site.primaryContact.phone.href}
                      className="underline decoration-ink/25 underline-offset-4 hover:decoration-signal"
                    >
                      {site.primaryContact.phone.display}
                    </a>
                  </span>,
                ],
                [
                  "Phone",
                  <a key="p" href={site.phone.href} className="underline decoration-ink/25 underline-offset-4 hover:decoration-signal">
                    {site.phone.display}
                  </a>,
                ],
              ].map(([k, v]) => (
                <div key={k as string} className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="t-label pt-1 text-mute">{k}</dt>
                  <dd className="text-[1.0625rem]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}

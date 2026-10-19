import { PageJsonLd } from "@/components/layout/json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { FinalCta } from "@/components/sections/final-cta";
import { FormatsSection } from "@/components/sections/formats";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { lifecycle, partnerOptions, phaseIntros, type Phase } from "@/lib/content";
import { jsonLd, pageMetadata, type PageSeo } from "@/lib/seo";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const page: PageSeo = {
  title: "Hackathon Management Services for Colleges",
  breadcrumb: "Services",
  description:
    "End-to-end hackathon management for colleges: strategy, branding, outreach, registrations, mentors and judges, evaluation, execution and post-event reporting.",
  path: "/services",
};

export const metadata = pageMetadata(page);

const phases: Phase[] = ["Plan", "Build-up", "Live", "After"];

function servicesJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Hackathon planning and management",
    provider: { "@id": `${site.url}/#organization` },
    areaServed: { "@type": "Country", name: "India" },
    audience: { "@type": "Audience", audienceType: "Colleges and educational institutions" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Hackathon services",
      itemListElement: lifecycle.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.body },
      })),
    },
  };
}

export default function ServicesPage() {
  return (
    <>
      <PageJsonLd page={page} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(servicesJsonLd())} />
      <PageHero
        eyebrow="Services"
        title="Everything a hackathon needs. One team accountable for it."
        lead="Eight stages from first idea to final report. Take the whole thing, or tell us which parts your college already has covered."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact" size="lg" arrow>
            Conduct a Hackathon
          </ButtonLink>
          <ButtonLink href="/how-it-works" size="lg" variant="secondary-dark">
            See How It Works
          </ButtonLink>
        </div>
      </PageHero>

      <Section aria-labelledby="stages-title">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>What we handle</SectionLabel>
              <SectionHeading id="stages-title" className="mt-6">
                The full lifecycle, stage by stage.
              </SectionHeading>
            </div>
            <p className="t-lead text-mute lg:col-span-5">
              Each stage comes with defined deliverables, so you can see exactly what you&apos;re getting before the
              event begins.
            </p>
          </div>

          <div className="mt-14 space-y-16 md:mt-20 md:space-y-20">
            {phases.map((phase) => {
              const stages = lifecycle.filter((s) => s.phase === phase);
              return (
                <div key={phase} className="grid gap-8 border-t border-ink pt-8 lg:grid-cols-12 lg:gap-12">
                  <div className="lg:col-span-3">
                    <h3 className="t-eyebrow text-signal">{phase}</h3>
                    <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-mute">{phaseIntros[phase]}</p>
                  </div>
                  <ul
                    className={cn(
                      "grid gap-px overflow-hidden rounded-md border border-line bg-line lg:col-span-9",
                      stages.length > 1 && "md:grid-cols-3",
                    )}
                  >
                    {stages.map((s, i) => (
                      <li
                        key={s.n}
                        data-reveal
                        style={{ ["--reveal-i" as string]: i }}
                        className={cn(
                          "flex flex-col bg-paper p-6 md:p-7",
                          stages.length === 1 && "md:grid md:grid-cols-2 md:gap-10",
                        )}
                      >
                        <div>
                          <p className="font-mono text-sm text-signal">{s.n}</p>
                          <h4 className="t-h3 mt-4">{s.title}</h4>
                          <p className="mt-3 text-[0.9375rem] leading-relaxed text-mute">{s.body}</p>
                        </div>
                        <ul
                          className={cn(
                            "mt-6 space-y-2 border-t border-line pt-5",
                            stages.length === 1 && "md:mt-0 md:self-end md:border-l md:border-t-0 md:pl-8 md:pt-0",
                          )}
                          aria-label={`${s.title} deliverables`}
                        >
                          {s.deliverables.map((d) => (
                            <li key={d} className="flex items-center gap-2.5 text-[0.9375rem]">
                              <span aria-hidden="true" className="size-1 shrink-0 bg-signal" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <FormatsSection tone="muted" />

      <Section tone="dark" aria-labelledby="partners-title">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionLabel tone="dark">For companies</SectionLabel>
              <SectionHeading id="partners-title" className="mt-6">
                Put your team in front of students who build.
              </SectionHeading>
              <p className="t-lead mt-6 text-white/70">
                Technology companies, startups and professionals can take part in the hackathons we run. Tell us how
                you&apos;d like to be involved.
              </p>
              <ButtonLink
                href="/contact?type=sponsorship#enquiry"
                size="lg"
                arrow
                className="mt-10"
              >
                Partner With Us
              </ButtonLink>
            </div>
            <ul className="grid gap-px self-start overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:col-span-7">
              {partnerOptions.map((p, i) => (
                <li key={p.title} data-reveal style={{ ["--reveal-i" as string]: i }} className="bg-ink p-6 md:p-8">
                  <p className="font-mono text-sm text-signal-soft">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-5 text-[1.1875rem] font-medium tracking-[-0.02em]">{p.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/60">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  );
}

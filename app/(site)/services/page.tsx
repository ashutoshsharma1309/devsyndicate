import { PageJsonLd } from "@/components/layout/json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { FinalCta } from "@/components/sections/final-cta";
import { FormatsSection } from "@/components/sections/formats";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import type { Metadata } from "next";
import { getServices, PHASES, type LifecycleStage } from "@/lib/cms";
import { cmsPageSeo, jsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const seo = () => cmsPageSeo("/services", { breadcrumb: "Services" });

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await seo());
}

function servicesJsonLd(lifecycle: readonly LifecycleStage[]) {
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

export default async function ServicesPage() {
  const [page, content] = await Promise.all([seo(), getServices()]);
  const { hero, stagesIntro, phaseIntros, stages: lifecycle, partners } = content;
  // A phase whose stages are all hidden is left out.
  const phases = PHASES.filter((phase) => lifecycle.some((s) => s.phase === phase));
  return (
    <>
      <PageJsonLd page={page} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(servicesJsonLd(lifecycle))} />
      <PageHero eyebrow={hero.eyebrow} title={hero.title} lead={hero.lead}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={hero.primaryCta.href} size="lg" arrow>
            {hero.primaryCta.label}
          </ButtonLink>
          <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary-dark">
            {hero.secondaryCta.label}
          </ButtonLink>
        </div>
      </PageHero>

      <Section aria-labelledby="stages-title">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>{stagesIntro.label}</SectionLabel>
              <SectionHeading id="stages-title" className="mt-6">
                {stagesIntro.heading}
              </SectionHeading>
            </div>
            <p className="t-lead text-mute lg:col-span-5">{stagesIntro.description}</p>
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
                        key={`${i}-${s.n}`}
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
                          {s.deliverables.map((d, j) => (
                            <li key={`${j}-${d}`} className="flex items-center gap-2.5 text-[0.9375rem]">
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
              <SectionLabel tone="dark">{partners.label}</SectionLabel>
              <SectionHeading id="partners-title" className="mt-6">
                {partners.heading}
              </SectionHeading>
              <p className="t-lead mt-6 text-white/70">{partners.description}</p>
              <ButtonLink href={partners.cta.href} size="lg" arrow className="mt-10">
                {partners.cta.label}
              </ButtonLink>
            </div>
            <ul className="grid gap-px self-start overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:col-span-7">
              {partners.options.map((p, i) => (
                <li key={`${i}-${p.title}`} data-reveal style={{ ["--reveal-i" as string]: i }} className="bg-ink p-6 md:p-8">
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

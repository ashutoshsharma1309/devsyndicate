import { PageJsonLd } from "@/components/layout/json-ld";
import { PageHero } from "@/components/layout/page-hero";
import { ProcessSteps } from "@/components/process/process-steps";
import { FinalCta } from "@/components/sections/final-cta";
import { ResponsibilitySplit } from "@/components/sections/responsibility-split";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import type { Metadata } from "next";
import { getHowItWorks } from "@/lib/cms";
import { cmsPageSeo, pageMetadata } from "@/lib/seo";

const seo = () => cmsPageSeo("/how-it-works", { breadcrumb: "How It Works" });

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await seo());
}

export default async function HowItWorksPage() {
  const [page, content] = await Promise.all([seo(), getHowItWorks()]);
  const { hero, stepsIntro, afterContact, timing } = content;
  return (
    <>
      <PageJsonLd page={page} />
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        lead={hero.lead}
        aside={
          hero.facts.length > 0 ? (
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/[0.09] bg-white/[0.09]">
              {hero.facts.map((f, i) => (
                <div key={`${i}-${f.label}`} className="bg-ink/90 p-4">
                  <dt className="t-label text-mute-dark">{f.label}</dt>
                  <dd className="mt-2 text-[0.9375rem] text-white">{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : undefined
        }
      />

      <Section aria-labelledby="steps-title">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>{stepsIntro.label}</SectionLabel>
              <SectionHeading id="steps-title" className="mt-6">
                {stepsIntro.heading}
              </SectionHeading>
            </div>
            <p className="t-lead text-mute lg:col-span-5">{stepsIntro.description}</p>
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
              <SectionLabel>{afterContact.label}</SectionLabel>
              <SectionHeading id="first-title" className="mt-6">
                {afterContact.heading}
              </SectionHeading>
              <p className="t-lead mt-6 text-mute">{afterContact.description}</p>
              <ButtonLink href={afterContact.cta.href} size="lg" arrow className="mt-10">
                {afterContact.cta.label}
              </ButtonLink>
            </div>
            <ol className="grid gap-px self-start overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:col-span-7">
              {afterContact.steps.map((s, i) => (
                <li key={`${i}-${s.title}`} data-reveal style={{ ["--reveal-i" as string]: i }} className="bg-paper p-6 md:p-8">
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
            <SectionLabel>{timing.label}</SectionLabel>
            <SectionHeading id="timing-title" className="mt-6">
              {timing.heading}
            </SectionHeading>
            <p className="t-lead mt-6 text-mute">{timing.description}</p>
          </div>
          <ul className="mt-14 grid gap-4 md:grid-cols-2">
            {timing.windows.map((w, i) => (
              <li
                key={`${i}-${w.label}`}
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

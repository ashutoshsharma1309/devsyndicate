import { Lifecycle } from "@/components/process/lifecycle";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { getHomepage, getServices } from "@/lib/cms";

export async function WhatWeDoSection({ withLink = true }: { withLink?: boolean }) {
  const [home, services] = await Promise.all([getHomepage(), getServices()]);
  const intro = home.sections.whatWeDo;
  return (
    <Section tone="dark" aria-labelledby="lifecycle-title" className="overflow-clip">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel tone="dark">{intro.label}</SectionLabel>
            <SectionHeading id="lifecycle-title" className="mt-6">
              {intro.heading}
            </SectionHeading>
          </div>
          <div className="lg:col-span-5">
            <p className="t-lead text-white/70">{intro.description}</p>
            {withLink && (
              <ButtonLink href="/services" variant="ghost-dark" arrow className="mt-6">
                See every service in detail
              </ButtonLink>
            )}
          </div>
        </div>
        <div className="mt-16 md:mt-24">
          <Lifecycle stages={services.stages} />
        </div>
      </Container>
    </Section>
  );
}

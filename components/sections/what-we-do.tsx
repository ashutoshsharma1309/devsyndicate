import { Lifecycle } from "@/components/process/lifecycle";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";

export function WhatWeDoSection({ withLink = true }: { withLink?: boolean }) {
  return (
    <Section tone="dark" aria-labelledby="lifecycle-title" className="overflow-clip">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel tone="dark">The partnership</SectionLabel>
            <SectionHeading id="lifecycle-title" className="mt-6">
              One partner. The entire hackathon.
            </SectionHeading>
          </div>
          <div className="lg:col-span-5">
            <p className="t-lead text-white/70">
              We handle the work behind the hackathon so your college can focus on the students. Eight stages, one
              team accountable for all of them.
            </p>
            {withLink && (
              <ButtonLink href="/services" variant="ghost-dark" arrow className="mt-6">
                See every service in detail
              </ButtonLink>
            )}
          </div>
        </div>
        <div className="mt-16 md:mt-24">
          <Lifecycle />
        </div>
      </Container>
    </Section>
  );
}

import { ProcessSteps } from "@/components/process/process-steps";
import { ButtonLink } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { getHomepage } from "@/lib/cms";

export async function HowItWorksSection() {
  const intro = (await getHomepage()).sections.howItWorks;
  return (
    <Section aria-labelledby="process-title">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel>{intro.label}</SectionLabel>
            <SectionHeading id="process-title" className="mt-6">
              {intro.heading}
            </SectionHeading>
          </div>
          <p className="t-lead text-mute lg:col-span-5">{intro.description}</p>
        </div>

        <div className="mt-14 md:mt-20">
          <ProcessSteps />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between md:mt-20">
          <p className="max-w-md text-[0.9375rem] text-mute">
            Step one takes a few minutes: tell us about your institution and the event you have in mind.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/how-it-works" variant="ghost" arrow className="justify-start sm:mr-4">
              The full process
            </ButtonLink>
            <Magnetic className="max-sm:w-full">
              <ButtonLink href="/contact" size="lg" arrow className="w-full sm:w-auto">
                Plan Your Hackathon
              </ButtonLink>
            </Magnetic>
          </div>
        </div>
      </Container>
    </Section>
  );
}

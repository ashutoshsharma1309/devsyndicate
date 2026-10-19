import { HomeHero } from "@/components/hero/home-hero";
import { PageJsonLd } from "@/components/layout/json-ld";
import { EcosystemSection } from "@/components/sections/ecosystem";
import { ExperienceSection } from "@/components/sections/experience";
import { FaqSection } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { FormatsSection } from "@/components/sections/formats";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { ExpectationsSection, OutcomesSection } from "@/components/sections/outcomes";
import { ProblemSection } from "@/components/sections/problem";
import { ResponsibilitySplit } from "@/components/sections/responsibility-split";
import { TeamSection } from "@/components/sections/team";
import { WhatWeDoSection } from "@/components/sections/what-we-do";
import { WhySection } from "@/components/sections/why";
import { pageMetadata, type PageSeo } from "@/lib/seo";
import { site } from "@/lib/site";

const page: PageSeo = { title: site.title, absoluteTitle: true, description: site.description, path: "/" };

export const metadata = pageMetadata(page);

export default function HomePage() {
  return (
    <>
      <PageJsonLd page={page} />
      <HomeHero />
      <ProblemSection />
      <WhatWeDoSection />
      <WhySection />
      <FormatsSection />
      <EcosystemSection />
      <HowItWorksSection />
      <ResponsibilitySplit />
      <ExperienceSection />
      <OutcomesSection />
      <ExpectationsSection />
      <FaqSection />
      <TeamSection tone="muted" />
      <FinalCta />
    </>
  );
}

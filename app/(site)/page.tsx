import type { Metadata } from "next";
import { HomeHero } from "@/components/hero/home-hero";
import { EcosystemSection } from "@/components/sections/ecosystem";
import { ExperienceSection } from "@/components/sections/experience";
import { FaqSection } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { FormatsSection } from "@/components/sections/formats";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { ExpectationsSection, OutcomesSection } from "@/components/sections/outcomes";
import { ProblemSection } from "@/components/sections/problem";
import { ResponsibilitySplit } from "@/components/sections/responsibility-split";
import { WhatWeDoSection } from "@/components/sections/what-we-do";
import { WhySection } from "@/components/sections/why";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: site.title },
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
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
      <FinalCta />
    </>
  );
}

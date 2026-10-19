import Link from "next/link";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { faqs } from "@/lib/content";
import { jsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function FaqSection() {
  return (
    <Section id="faq" aria-labelledby="faq-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd())} />
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <SectionLabel>FAQ</SectionLabel>
              <SectionHeading id="faq-title" className="mt-6">
                Questions colleges ask us.
              </SectionHeading>
              <p className="t-body mt-6 max-w-sm text-mute">
                Something not covered here?{" "}
                <Link href="/contact" className="text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-signal">
                  Send us your question
                </Link>{" "}
                or write to{" "}
                <a href={`mailto:${site.email}`} className="text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-signal">
                  {site.email}
                </a>
                .
              </p>
            </div>
          </div>

          <div className="border-t border-line lg:col-span-8">
            {faqs.map((f) => (
              <details key={f.q} className="faq-item group border-b border-line">
                <summary className="flex cursor-pointer items-start justify-between gap-6 py-6 text-left text-[1.125rem] font-medium leading-snug tracking-[-0.02em] transition-colors hover:text-signal md:py-7 md:text-[1.25rem]">
                  <h3>{f.q}</h3>
                  <span
                    aria-hidden="true"
                    className="relative mt-1.5 size-4 shrink-0 text-mute transition-transform duration-500 ease-[var(--ease-out-expo)] group-open:rotate-45 group-open:text-signal"
                  >
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current" />
                  </span>
                </summary>
                <p className="t-body max-w-2xl pb-7 pr-10 text-mute">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

import type { ReactNode } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { Container } from "@/components/ui/section";

/** Long-form legal page: dark header, readable prose column with a section index. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: { id: string; title: string; body: ReactNode }[];
}) {
  return (
    <>
      <PageHero eyebrow={`Last updated ${updated}`} title={title} lead={intro} />
      <section className="bg-paper">
        <Container className="grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-16">
          <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-28">
              <p className="t-label text-mute">On this page</p>
              <ol className="mt-5 space-y-2.5 text-sm">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="flex gap-3 text-mute transition-colors hover:text-ink">
                      <span className="font-mono text-xs leading-5 text-signal">{String(i + 1).padStart(2, "0")}</span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
          <div className="legal max-w-[68ch] lg:col-span-8 lg:col-start-5">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="border-t border-line py-10 first:border-t-0 first:pt-0">
                <h2 id={`${s.id}-h`} className="flex gap-4 text-[1.375rem] font-medium tracking-[-0.025em]">
                  <span className="font-mono text-sm leading-8 text-signal">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="mt-5 space-y-4 text-[1rem] leading-[1.75] text-ink/80 [&_a]:text-ink [&_a]:underline [&_a]:decoration-ink/25 [&_a]:underline-offset-4 hover:[&_a]:decoration-signal [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

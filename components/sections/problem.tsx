import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { getHomepage } from "@/lib/cms";
import { problems } from "@/lib/content";

export async function ProblemSection() {
  const intro = (await getHomepage()).sections.problem;
  return (
    <Section aria-labelledby="problem-title">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <SectionLabel>{intro.label}</SectionLabel>
              <SectionHeading id="problem-title" className="mt-6">
                {intro.heading}
              </SectionHeading>
              <p className="t-lead mt-6 max-w-md text-mute">{intro.description}</p>
            </div>
          </div>

          <ul className="border-t border-line lg:col-span-7">
            {problems.map((p, i) => (
              <li
                key={p.title}
                data-reveal
                style={{ ["--reveal-i" as string]: i }}
                className="grid gap-3 border-b border-line py-8 sm:grid-cols-[11rem_1fr] sm:gap-8 md:py-10"
              >
                <h3 className="t-h3">{p.title}</h3>
                <p className="t-body text-mute sm:pt-1">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <p
          data-reveal
          className="mt-20 flex flex-wrap items-baseline gap-x-5 gap-y-3 text-[clamp(1.75rem,1.1rem+2.4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.04em] md:mt-28"
        >
          <span aria-hidden="true" className="inline-block h-px w-14 translate-y-[-0.3em] bg-signal md:w-24" />
          That&apos;s where Dev Syndicate comes in.
        </p>
      </Container>
    </Section>
  );
}

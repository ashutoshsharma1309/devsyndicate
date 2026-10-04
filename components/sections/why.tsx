import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { differentiators } from "@/lib/content";
import { cn } from "@/lib/utils";

const spans = ["md:col-span-3", "md:col-span-3", "md:col-span-2", "md:col-span-2", "md:col-span-2"];

export function WhySection() {
  return (
    <Section tone="muted" aria-labelledby="why-title">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel>Why Dev Syndicate</SectionLabel>
            <SectionHeading id="why-title" className="mt-6">
              Not just another college event.
            </SectionHeading>
          </div>
          <p className="t-lead text-mute lg:col-span-5">
            A hackathon run well puts your institution in front of students, companies and other campuses. That only
            happens when it&apos;s designed for it.
          </p>
        </div>

        <ul className="mt-14 grid border-l border-t border-line md:mt-20 md:grid-cols-6">
          {differentiators.map((d, i) => (
            <li
              key={d.title}
              data-reveal
              style={{ ["--reveal-i" as string]: i }}
              className={cn(
                "group relative border-b border-r border-line p-7 transition-colors duration-500 hover:bg-paper md:p-9",
                spans[i],
              )}
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-px w-0 bg-signal transition-[width] duration-700 ease-[var(--ease-out-expo)] group-hover:w-full"
              />
              <h3 className={cn("t-h3", i < 2 && "md:text-[1.875rem] md:tracking-[-0.03em]")}>{d.title}</h3>
              <p className="t-body mt-4 max-w-md text-mute">{d.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

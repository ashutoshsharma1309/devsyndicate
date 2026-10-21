import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { CountUp } from "@/components/ui/count-up";
import { getHomepage } from "@/lib/cms";
import { expectations, outcomeMetrics } from "@/lib/content";

export async function OutcomesSection() {
  const intro = (await getHomepage()).sections.outcomes;
  return (
    <Section aria-labelledby="outcomes-title">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel>{intro.label}</SectionLabel>
            <SectionHeading id="outcomes-title" className="mt-6">
              {intro.heading}
            </SectionHeading>
          </div>
          <p className="t-lead text-mute lg:col-span-5">{intro.description}</p>
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 md:mt-20 lg:grid-cols-4">
          {outcomeMetrics.map((m, i) => (
            <li
              key={m.label}
              data-reveal
              style={{ ["--reveal-i" as string]: i % 4 }}
              className="group flex min-h-[12.5rem] flex-col bg-paper p-6 transition-colors duration-500 hover:bg-white md:p-7"
            >
              <p className="t-label flex items-center justify-between text-mute">
                <span>M.{String(i + 1).padStart(2, "0")}</span>
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-ink/15 transition-colors duration-500 group-hover:bg-signal"
                />
              </p>
              {m.value !== null ? (
                <p className="mt-auto pt-8 text-[clamp(2.25rem,1.6rem+2vw,3.25rem)] font-medium leading-none tracking-[-0.045em]">
                  <CountUp value={m.value} suffix={m.suffix} />
                </p>
              ) : null}
              <h3 className={m.value !== null ? "mt-3 font-medium" : "mt-auto pt-8 t-h3"}>{m.label}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-mute">{m.detail}</p>
            </li>
          ))}
          <li className="on-dark flex min-h-[12.5rem] flex-col bg-ink p-6 text-white md:p-7">
            <p className="t-label text-signal-soft">The report</p>
            <p className="mt-auto pt-8 text-[1.125rem] leading-snug tracking-[-0.015em]">
              Participation, projects and engagement — plus what worked, and what to change next time.
            </p>
          </li>
        </ul>
      </Container>
    </Section>
  );
}

export async function ExpectationsSection() {
  const intro = (await getHomepage()).sections.expectations;
  return (
    <Section tone="muted" aria-labelledby="expect-title">
      <Container>
        <div className="max-w-3xl">
          <SectionLabel>{intro.label}</SectionLabel>
          <SectionHeading id="expect-title" className="mt-6">
            {intro.heading}
          </SectionHeading>
          {/* No paragraph by default; shown once one is published. */}
          {intro.description && <p className="t-lead mt-6 max-w-2xl text-mute">{intro.description}</p>}
        </div>
        <ol className="mt-14 grid gap-10 sm:grid-cols-2 md:mt-20 lg:grid-cols-5 lg:gap-8">
          {expectations.map((e, i) => (
            <li key={e.title} data-reveal style={{ ["--reveal-i" as string]: i }} className="border-t border-ink pt-6">
              <p className="font-mono text-sm text-signal">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 text-[1.1875rem] font-medium leading-snug tracking-[-0.02em]">{e.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-mute">{e.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

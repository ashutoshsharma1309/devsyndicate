import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { responsibilities } from "@/lib/content";

function Tick({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 8.5l3 3 7-7" strokeLinecap="square" />
    </svg>
  );
}

export function ResponsibilitySplit() {
  return (
    <Section tone="muted" aria-labelledby="split-title">
      <Container>
        <div className="max-w-3xl">
          <SectionLabel>Who does what</SectionLabel>
          <SectionHeading id="split-title" className="mt-6">
            You bring the campus. We handle the execution.
          </SectionHeading>
          <p className="t-lead mt-6 max-w-2xl text-mute">
            The division of work is agreed up front, so nobody on your side is surprised by what lands on their desk.
          </p>
        </div>

        <div className="mt-14 grid overflow-hidden rounded-md border border-line md:mt-20 md:grid-cols-[5fr_7fr]">
          <div data-reveal className="bg-paper p-7 md:p-10">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="t-h3">Your college</h3>
              <span className="t-label text-mute">{responsibilities.college.length} items</span>
            </div>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {responsibilities.college.map((item) => (
                <li key={item} className="flex items-center gap-3 py-3.5 text-[0.9375rem]">
                  <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-ink/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            data-reveal
            style={{ ["--reveal-i" as string]: 1 }}
            className="on-dark relative bg-ink p-7 text-white md:p-10"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="t-h3">Dev Syndicate</h3>
              <span className="t-label text-signal-soft">{responsibilities.devSyndicate.length} items</span>
            </div>
            <ul className="mt-8 grid border-t border-white/10 sm:grid-cols-2 sm:gap-x-8">
              {responsibilities.devSyndicate.map((item) => (
                <li key={item} className="flex items-center gap-3 border-b border-white/10 py-3.5 text-[0.9375rem]">
                  <Tick className="size-4 shrink-0 text-signal-soft" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

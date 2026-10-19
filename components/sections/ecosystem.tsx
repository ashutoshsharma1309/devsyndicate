import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { ecosystem } from "@/lib/content";

/**
 * Six participants in a hackathon, joined by one signal path. A pulse runs
 * the length of the path and each node lights as it passes. Pure CSS.
 */
export function EcosystemSection() {
  const n = ecosystem.length;
  return (
    <Section tone="dark" aria-labelledby="ecosystem-title" className="overflow-clip">
      <div
        aria-hidden="true"
        className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
      />
      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionLabel tone="dark">The ecosystem</SectionLabel>
            <SectionHeading id="ecosystem-title" className="mt-6">
              Connect students with the people building technology.
            </SectionHeading>
          </div>
          <p className="t-lead text-white/70 lg:col-span-5">
            A hackathon is only as good as the people around the builders. We bring the right people into the room,
            and make sure each one has a defined role.
          </p>
        </div>

        <ol
          data-ambient
          className="eco relative mt-16 grid gap-0 md:mt-24 lg:grid-cols-6"
          style={{ ["--eco-n" as string]: n }}
        >
          {/* the path */}
          <span aria-hidden="true" className="eco-track" />
          {ecosystem.map((e, i) => (
            <li
              key={e.label}
              data-reveal
              style={{ ["--reveal-i" as string]: i, ["--i" as string]: i }}
              className="eco-node relative pb-10 pl-10 last:pb-0 lg:pb-0 lg:pl-0 lg:pr-6 lg:pt-12"
            >
              <span aria-hidden="true" className="eco-dot" />
              <p className="t-label text-mute-dark">
                <span className="eco-index">N.{String(i + 1).padStart(2, "0")}</span>
                {i < n - 1 && <span className="ml-2 text-white/25 lg:hidden">↓</span>}
              </p>
              <h3 className="mt-3 text-[1.375rem] font-medium leading-tight tracking-[-0.03em] lg:text-[1.5rem]">
                {e.label}
              </h3>
              <p className="t-body mt-2 max-w-[22ch] text-[0.9375rem] text-white/60 max-lg:max-w-sm">{e.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

import { ButtonLink } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { trustPoints } from "@/lib/content";
import { HackathonNetwork } from "./hackathon-network";

const headline = ["Bring a national-level", "hackathon to", "your campus."];

export function HomeHero() {
  return (
    <section aria-labelledby="hero-title" className="on-dark relative overflow-hidden bg-ink text-white">
      <div
        aria-hidden="true"
        className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(120%_80%_at_70%_0%,black,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[720px] rounded-full bg-signal/20 blur-[140px]"
      />

      <div className="container-x relative pb-16 pt-32 md:pb-20 md:pt-40 lg:pt-44">
        <p className="t-eyebrow fade-in flex items-center gap-3 text-signal-soft">
          <span aria-hidden="true" className="inline-block h-px w-6 bg-current" />
          Hackathon partner for colleges
        </p>

        <h1 id="hero-title" className="t-display mt-7 max-w-[13ch] md:max-w-none">
          {headline.map((line, i) => (
            <span key={line} className="rise-line" style={{ ["--i" as string]: i }}>
              <span>{line}</span>
            </span>
          ))}
        </h1>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:items-end">
          <p
            className="t-lead fade-in max-w-xl text-white/72 lg:col-span-6"
            style={{ ["--delay" as string]: "350ms" }}
          >
            Dev Syndicate helps colleges plan, promote, manage and execute professional hackathons with industry
            judges, mentors, technology partners and student communities.
          </p>
          <div
            className="fade-in flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-6 lg:justify-end"
            style={{ ["--delay" as string]: "480ms" }}
          >
            <Magnetic className="max-sm:w-full">
              <ButtonLink href="/contact" size="lg" arrow className="w-full sm:w-auto">
                Conduct a Hackathon
              </ButtonLink>
            </Magnetic>
            <ButtonLink href="/how-it-works" variant="secondary-dark" size="lg">
              See How It Works
            </ButtonLink>
          </div>
        </div>

        <figure
          className="fade-in mt-16 rounded-md border border-white/[0.09] bg-carbon/60 backdrop-blur-sm md:mt-20"
          style={{ ["--delay" as string]: "620ms" }}
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 md:px-6">
            <figcaption className="t-label text-mute-dark">Fig. 01 — The hackathon network</figcaption>
            <span className="t-label hidden items-center gap-2 text-mute-dark sm:flex">
              <span aria-hidden="true" className="node-blink inline-block size-1.5 rounded-full bg-signal-soft" />
              One partner, every connection
            </span>
          </div>
          <div className="px-3 py-6 md:px-8 md:py-10">
            <HackathonNetwork />
          </div>
        </figure>
      </div>

      {/* Trust / positioning strip */}
      <div className="relative border-t border-white/[0.07]">
        <div className="container-x grid gap-6 py-10 md:py-12 lg:grid-cols-12 lg:items-center">
          <p className="text-lg tracking-[-0.02em] text-white lg:col-span-4">
            Built for colleges that want more than another campus event.
          </p>
          <ul className="flex flex-wrap gap-x-2 gap-y-3 lg:col-span-8 lg:justify-end">
            {trustPoints.map((t) => (
              <li
                key={t}
                className="t-label flex items-center gap-2 rounded-xs border border-white/10 px-3 py-2 text-white/75"
              >
                <span aria-hidden="true" className="inline-block size-1 bg-signal-soft" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

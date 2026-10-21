import { ButtonLink } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { MotionToggle } from "@/components/ui/motion-toggle";
import { getHomepage } from "@/lib/cms";
import { HackathonNetwork } from "./hackathon-network";

/** Homepage hero and trust strip. Copy comes from the published homepage content. */
export async function HomeHero() {
  const { hero, trust } = await getHomepage();
  const headline = hero.headline;
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
          {hero.eyebrow}
        </p>

        <h1 id="hero-title" className="t-display mt-7 max-w-[13ch] md:max-w-none">
          {headline.map((line, i) => (
            <span key={i} className="rise-line" style={{ ["--i" as string]: i }}>
              {/* Trailing space keeps the heading's text content readable ("national-level hackathon"). */}
              <span>{i < headline.length - 1 ? `${line} ` : line}</span>
            </span>
          ))}
        </h1>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:items-end">
          <p
            className="t-lead fade-in max-w-xl text-white/72 lg:col-span-6"
            style={{ ["--delay" as string]: "350ms" }}
          >
            {hero.lead}
          </p>
          <div
            className="fade-in flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-6 lg:justify-end"
            style={{ ["--delay" as string]: "480ms" }}
          >
            <Magnetic className="max-sm:w-full">
              <ButtonLink href={hero.primaryCta.href} size="lg" arrow className="w-full sm:w-auto">
                {hero.primaryCta.label}
              </ButtonLink>
            </Magnetic>
            <ButtonLink href={hero.secondaryCta.href} variant="secondary-dark" size="lg">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>

        <figure
          data-ambient
          className="fade-in mt-16 rounded-md border border-white/[0.09] bg-carbon/60 backdrop-blur-sm md:mt-20"
          style={{ ["--delay" as string]: "620ms" }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3 md:px-6">
            <figcaption className="t-label text-mute-dark">Fig. 01 — The hackathon network</figcaption>
            {/* The pause control stays visible at every width; only the tagline drops on mobile. */}
            <div className="flex items-center gap-4">
              <span className="t-label hidden items-center gap-2 text-mute-dark sm:flex">
                <span aria-hidden="true" className="node-blink inline-block size-1.5 rounded-full bg-signal-soft" />
                One partner, every connection
              </span>
              <span aria-hidden="true" className="hidden h-3 w-px bg-white/10 sm:block" />
              <MotionToggle />
            </div>
          </div>
          <div className="px-3 py-6 md:px-8 md:py-10">
            <HackathonNetwork />
          </div>
        </figure>
      </div>

      {/* Trust / positioning strip */}
      <div className="relative border-t border-white/[0.07]">
        <div className="container-x grid gap-6 py-10 md:py-12 lg:grid-cols-12 lg:items-center">
          <p className="text-lg tracking-[-0.02em] text-white lg:col-span-4">{trust.line}</p>
          <ul className="flex flex-wrap gap-x-2 gap-y-3 lg:col-span-8 lg:justify-end">
            {trust.points.map((t, i) => (
              <li
                key={`${i}-${t}`}
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

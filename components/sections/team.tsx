import { ArrowUpRight } from "lucide-react";
import { Container, Section, SectionHeading, SectionLabel } from "@/components/ui/section";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { site, team } from "@/lib/site";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);

/**
 * Founder and co-founder. Typography-led on purpose: no photographs have been
 * supplied, and the only verified details are name, role and LinkedIn profile.
 */
export function TeamSection({ tone = "light" }: { tone?: "light" | "muted" }) {
  return (
    <Section tone={tone} aria-labelledby="team-title">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionLabel>The team</SectionLabel>
            <SectionHeading id="team-title" className="mt-6">
              Meet the people behind Dev Syndicate.
            </SectionHeading>
            <p className="t-lead mt-6 max-w-md text-mute">
              Dev Syndicate is led by its founder and co-founder. You&apos;ll know who you&apos;re working with from the
              first conversation.
            </p>
          </div>

          <ul className="grid gap-px self-start overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:col-span-7">
            {team.map((person, i) => {
              const isContact = "primaryContact" in person && person.primaryContact;
              return (
                <li key={person.name} data-reveal style={{ ["--reveal-i" as string]: i }} className="flex flex-col bg-paper p-7 md:p-9">
                  {/* Monogram on an offset plate — the same "extruded tile" used in the hero schematic. */}
                  <span aria-hidden="true" className="relative block size-16">
                    <span className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-sm bg-signal" />
                    <span className="relative grid size-16 place-items-center rounded-sm bg-ink font-mono text-lg tracking-[0.04em] text-white">
                      {initials(person.name)}
                    </span>
                  </span>

                  <p className="t-label mt-9 text-signal">
                    {String(i + 1).padStart(2, "0")} · {person.role}
                  </p>
                  <h3 className="t-h3 mt-3">{person.name}</h3>
                  <p className="mt-2 min-h-[1.5em] text-[0.9375rem] text-mute">
                    {isContact ? "Primary contact for enquiries" : `${person.role}, ${site.name}`}
                  </p>

                  <div className="flex flex-col gap-1.5 pt-8 text-[0.9375rem]">
                    <a
                      href={person.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track-label={person.role.toLowerCase()}
                      className="group inline-flex items-center gap-2.5 self-start py-1 font-medium text-ink transition-colors duration-200 hover:text-signal"
                    >
                      <LinkedInIcon className="size-4 text-[#0a66c2]" />
                      LinkedIn profile
                      <span className="sr-only">
                        {" "}
                        of {person.name} (opens in a new tab)
                      </span>
                      <ArrowUpRight
                        aria-hidden="true"
                        strokeWidth={1.6}
                        className="size-4 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"
                      />
                    </a>
                    {isContact && (
                      <a
                        href={site.primaryContact.phone.href}
                        className="self-start py-1 text-mute underline decoration-ink/20 underline-offset-4 transition-colors duration-200 hover:text-ink hover:decoration-signal"
                      >
                        {site.primaryContact.phone.display}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

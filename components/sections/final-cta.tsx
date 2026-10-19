import { ButtonLink } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { Container } from "@/components/ui/section";
import { site } from "@/lib/site";

const inline = "text-white/85 underline decoration-white/20 underline-offset-4 transition-colors duration-200 hover:text-white hover:decoration-white/60";

export function FinalCta({
  title = "Let's build something worth putting your campus behind.",
  body = "Tell us what you have in mind. We'll understand your requirements, recommend an event structure and get back to you for a quick discussion.",
}: {
  title?: string;
  body?: string;
}) {
  const contact = site.primaryContact;
  return (
    <section aria-labelledby="cta-title" className="on-dark relative overflow-hidden bg-ink text-white">
      <div
        aria-hidden="true"
        className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(90%_100%_at_50%_100%,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-signal/25 blur-[140px]"
      />

      <Container className="relative py-24 text-center md:py-36">
        <p className="t-eyebrow text-signal-soft">Start the conversation</p>
        <h2 id="cta-title" className="t-h1 mx-auto mt-7 max-w-[18ch]">
          {title}
        </h2>
        <p className="t-lead mx-auto mt-7 max-w-2xl text-white/70">{body}</p>
        <div className="mt-11 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Magnetic className="max-sm:w-full">
            <ButtonLink href="/contact" size="lg" arrow className="w-full sm:w-auto">
              Conduct a Hackathon
            </ButtonLink>
          </Magnetic>
          <ButtonLink href={`mailto:${site.email}`} variant="secondary-dark" size="lg">
            Email {site.name}
          </ButtonLink>
        </div>
        <p className="mx-auto mt-10 max-w-xl text-sm leading-relaxed text-mute-dark">
          Or call {contact.name} on{" "}
          <a href={contact.phone.href} className={inline}>
            {contact.phone.display}
          </a>{" "}
          · connect on{" "}
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={inline}
          >
            LinkedIn
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </Container>
    </section>
  );
}

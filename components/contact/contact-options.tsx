import { ArrowRight, ArrowUpRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";
import { getContactInfo } from "@/lib/cms";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

type Option = { label: string; value: ReactNode; note: string; href: string; icon: ReactNode; external?: boolean };

/**
 * The ways to reach Dev Syndicate, side by side: call, email, LinkedIn (unless
 * hidden in the published contact details) and the enquiry form (unless it is
 * closed: `formHref` null). Every option is a real link (tel:, mailto:, profile, form).
 */
export async function ContactOptions({
  tone = "light",
  formHref = "/contact#enquiry",
  className,
}: {
  tone?: Tone;
  /** Where "Send an enquiry" points: the form section on /contact, or the page itself. null = no form option. */
  formHref?: string | null;
  className?: string;
}) {
  const info = await getContactInfo();
  const contact = info.primaryContact;
  const dark = tone === "dark";
  const all: (Option | false)[] = [
    {
      label: `Call ${contact.name}`,
      value: contact.phone.display,
      note: "Speak to us directly",
      href: contact.phone.href,
      icon: <Phone strokeWidth={1.6} className="size-4" />,
    },
    {
      label: "Email the team",
      value: info.email,
      note: "We reply from this address",
      href: `mailto:${info.email}`,
      icon: <Mail strokeWidth={1.6} className="size-4" />,
    },
    info.showPrimaryContactLinkedin && {
      label: "Connect on LinkedIn",
      value: contact.name,
      note: `${contact.role}, ${site.name}`,
      href: contact.linkedin,
      icon: <LinkedInIcon className="size-3.5" />,
      external: true,
    },
    formHref !== null && {
      label: "Send an enquiry",
      value: "Collaboration form",
      note: "Takes about two minutes",
      href: formHref,
      icon: <ArrowRight strokeWidth={1.6} className="size-4" />,
    },
  ];
  const options = all.filter((o): o is Option => o !== false);

  return (
    <ul
      data-track-placement="contact-options"
      className={cn(
        "grid gap-px overflow-hidden rounded-md border sm:grid-cols-2",
        options.length === 4 ? "lg:grid-cols-4" : options.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2",
        dark ? "border-white/[0.09] bg-white/[0.09]" : "border-line bg-line",
        className,
      )}
    >
      {options.map((o) => {
        const inner = (
          <>
            <span className="flex items-center justify-between gap-3">
              <span className={cn("t-label", dark ? "text-mute-dark" : "text-mute")}>{o.label}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-8 place-items-center rounded-sm border transition-colors duration-200",
                  dark
                    ? "border-white/12 text-signal-soft group-hover:border-signal-soft/60"
                    : "border-line text-signal group-hover:border-signal/50",
                )}
              >
                {o.icon}
              </span>
            </span>
            <span className="mt-6 block break-words text-[1.0625rem] font-medium tracking-[-0.015em]">
              {o.value}
              {o.external && (
                <>
                  <ArrowUpRight aria-hidden="true" strokeWidth={1.6} className="ml-1 inline size-4 align-[-2px] opacity-60" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </>
              )}
            </span>
            <span className={cn("mt-1 block text-sm", dark ? "text-mute-dark" : "text-mute")}>{o.note}</span>
          </>
        );
        const cls = cn(
          "group flex h-full flex-col p-5 transition-colors duration-200 md:p-6",
          dark ? "bg-ink hover:bg-carbon" : "bg-paper hover:bg-white",
        );
        return (
          <li key={o.label}>
            {o.external ? (
              <a
                href={o.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cls}
              >
                {inner}
              </a>
            ) : o.href.startsWith("/") ? (
              <Link href={o.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <a href={o.href} className={cls}>
                {inner}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { MotionToggle } from "@/components/ui/motion-toggle";
import { footerNav, site, team } from "@/lib/site";
import { CurrentYear } from "./current-year";

const link = "inline-block py-1 text-[0.9375rem] text-white/80 transition-colors hover:text-white";

type Phone = { display: string; href: string };

/** Everything the footer shows that can be edited. */
export type FooterData = {
  tagline: string;
  email: string;
  primaryContact: { name: string; phone: Phone };
  /** null = hidden (contact.visibility.showCompanyPhone). */
  companyPhone: Phone | null;
  location: { city: string; region: string; country: string };
  team: readonly { name: string; role: string; linkedin: string }[];
};

/** The site's built-in details, for the client-side error boundary (app/error.tsx), which can't read content. */
export const staticFooterData: FooterData = {
  tagline: site.tagline,
  email: site.email,
  primaryContact: { name: site.primaryContact.name, phone: site.primaryContact.phone },
  companyPhone: site.phone,
  location: site.location,
  team,
};

/** Presentational footer. `Footer` (./footer.tsx) fills it from published content. */
export function FooterView({ data }: { data: FooterData }) {
  return (
    <footer className="on-dark border-t border-white/[0.07] bg-ink text-white">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo />
          <p className="t-body mt-6 max-w-sm text-mute-dark">{data.tagline}</p>
        </div>

        <nav aria-label="Footer" className="md:col-span-2">
          <h2 className="t-label text-mute-dark">Navigate</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-1">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="t-label text-mute-dark">Contact</h2>
          <address className="mt-4 space-y-1 not-italic">
            <a href={`mailto:${data.email}`} className={`${link} break-all`}>
              {data.email}
            </a>
            <p>
              <a href={data.primaryContact.phone.href} className={link}>
                {data.primaryContact.phone.display}
              </a>
              <span className="block text-[0.8125rem] text-mute-dark">{data.primaryContact.name}, primary contact</span>
            </p>
            {data.companyPhone && (
              <p>
                <a href={data.companyPhone.href} className={link}>
                  {data.companyPhone.display}
                </a>
              </p>
            )}
            <p className="pt-2 text-[0.9375rem] text-mute-dark">
              {data.location.city}, {data.location.region}, {data.location.country}
            </p>
          </address>
        </div>

        <div className="md:col-span-3">
          <h2 className="t-label text-mute-dark">Team</h2>
          <ul className="mt-4 space-y-1">
            {data.team.map((p, i) => (
              <li key={`${i}-${p.name}`}>
                <a
                  href={p.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track-label={p.role.toLowerCase()}
                  className={link}
                >
                  {p.name} <span className="text-mute-dark">· {p.role}</span>
                  <span aria-hidden="true" className="ml-1 text-mute-dark">
                    ↗
                  </span>
                  <span className="sr-only"> on LinkedIn (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          {site.social.length > 0 && (
            <ul className="mt-6 flex gap-4">
              {site.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener noreferrer" target="_blank" className="text-sm text-mute-dark hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-white/[0.07]">
        <div className="container-x flex flex-col gap-2 py-6 text-[0.8125rem] text-mute-dark sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {site.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {/* Already styled as a t-label text button that matches this bar. */}
            <MotionToggle />
            <p className="t-label">Hackathons for colleges · India</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

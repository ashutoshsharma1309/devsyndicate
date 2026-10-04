import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { footerNav, site } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark border-t border-white/[0.07] bg-ink text-white">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <Logo />
          <p className="t-body mt-6 max-w-sm text-mute-dark">{site.tagline}</p>
        </div>

        <nav aria-label="Footer" className="md:col-span-3">
          <h2 className="t-label text-mute-dark">Navigate</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-1">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-[0.9375rem] text-white/80 transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-4">
          <h2 className="t-label text-mute-dark">Contact</h2>
          <address className="mt-5 space-y-3 text-[0.9375rem] not-italic">
            <a href={`mailto:${site.email}`} className="block text-white/80 transition-colors hover:text-white">
              {site.email}
            </a>
            <a href={site.phone.href} className="block text-white/80 transition-colors hover:text-white">
              {site.phone.display}
            </a>
            <p className="text-mute-dark">
              {site.location.city}, {site.location.region}, {site.location.country}
            </p>
          </address>
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
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="t-label">Hackathons for colleges · India</p>
        </div>
      </div>
    </footer>
  );
}

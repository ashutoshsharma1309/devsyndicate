"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import { nav, primaryCta, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** What the mobile menu shows under its call to action. Server parents pass the published details. */
export type NavbarContact = { email: string; name: string; phone: { display: string; href: string } };

const staticContact: NavbarContact = {
  email: site.email,
  name: site.primaryContact.name,
  phone: { display: site.primaryContact.phone.display, href: site.primaryContact.phone.href },
};

/**
 * `contact` comes from published content (app/(site)/layout.tsx). Without it
 * (the client-side error boundary) the site's built-in details are shown.
 */
export function Navbar({ contact = staticContact }: { contact?: NavbarContact }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu whenever the route changes (adjusting state during render,
  // rather than in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    // The menu only exists below md (its button is md:hidden). If the viewport grows past md
    // while it's open (rotation, resizing), close it — otherwise the page behind would stay
    // inert and scroll-locked with no visible way to close the menu.
    const desktop = window.matchMedia("(min-width: 48rem)");
    const closeOnDesktop = () => desktop.matches && setOpen(false);
    desktop.addEventListener("change", closeOnDesktop);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a")?.focus();
    // Take the page behind the menu out of reach of keyboard and screen readers
    // (the focus trap below only covers Tab).
    const behind = [document.getElementById("main"), document.querySelector<HTMLElement>("#main ~ footer")].filter(
      (el): el is HTMLElement => el !== null,
    );
    behind.forEach((el) => (el.inert = true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      // Keep focus inside the open menu.
      if (e.key === "Tab" && panel) {
        const focusables = [toggleRef.current, ...panel.querySelectorAll<HTMLElement>("a")].filter(
          Boolean,
        ) as HTMLElement[];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = prev;
      behind.forEach((el) => (el.inert = false));
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "on-dark fixed inset-x-0 top-0 z-50 print:static transition-[background-color,border-color,backdrop-filter] duration-500",
        // No backdrop-filter while the menu is open: it would become the containing
        // block for the fixed mobile panel and collapse it to the header's height.
        open
          ? "border-b border-white/[0.07] bg-ink"
          : solid
            ? "border-b border-white/[0.07] bg-ink/85 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="t-label sr-only z-[60] rounded-sm bg-signal px-3 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      <div className="container-x flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        <Logo />

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-sm px-3.5 py-2 text-[0.9375rem] transition-colors",
                      active ? "text-white" : "text-mute-dark hover:text-white",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-signal-soft transition-transform duration-500 ease-out",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href={primaryCta.href} size="md" className="h-10 px-4 text-sm max-sm:hidden">
            {primaryCta.label}
          </ButtonLink>
          <button
            ref={toggleRef}
            type="button"
            className="relative -mr-2 inline-flex size-11 items-center justify-center rounded-sm text-white md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute left-0 h-px w-5 bg-current transition-transform duration-300",
                  open ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 h-px w-5 bg-current transition-transform duration-300",
                  open ? "top-1.5 -rotate-45" : "top-3",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto overscroll-contain border-t border-white/[0.07] bg-ink md:hidden"
      >
        <nav aria-label="Mobile" className="container-x flex min-h-full flex-col pb-10 pt-6">
          <ul className="divide-y divide-white/[0.07] border-b border-white/[0.07]">
            {[{ href: "/", label: "Home" }, ...nav, { href: "/contact", label: "Contact" }].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="flex items-center justify-between py-5 text-2xl tracking-[-0.03em] text-white aria-[current=page]:text-signal-soft"
                >
                  {item.label}
                  <span aria-hidden="true" className="t-label text-mute-dark">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-10">
            <ButtonLink href={primaryCta.href} size="lg" arrow className="w-full">
              {primaryCta.label}
            </ButtonLink>
            <div className="mt-6 space-y-1 text-sm text-mute-dark">
              <a className="block py-1 hover:text-white" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
              <a className="block py-1 hover:text-white" href={contact.phone.href}>
                {contact.phone.display}
                <span> · {contact.name}</span>
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

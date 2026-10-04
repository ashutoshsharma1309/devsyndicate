/**
 * Company details. Every value here is taken from the current public
 * Dev Syndicate website (devsyndicate.co.in). Do not add details that
 * cannot be verified — leave them out instead.
 */
export const site = {
  name: "Dev Syndicate",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.devsyndicate.co.in").replace(/\/$/, ""),
  title: "Dev Syndicate — Build a Hackathon for Your Campus",
  description:
    "Dev Syndicate helps colleges plan, promote and run professional hackathons with students, mentors, judges and industry partners.",
  tagline: "Building better hackathons. Connecting campuses with industry.",
  email: "dsdevsyndicate@gmail.com",
  phone: {
    display: "+91 95073 64491",
    href: "tel:+919507364491",
    e164: "+919507364491",
  },
  location: {
    city: "Bengaluru",
    region: "Karnataka",
    country: "India",
    countryCode: "IN",
  },
  // Social links are intentionally empty: the current site has no live profile URLs.
  // Add entries here (label + href) once real profiles exist; the footer renders them automatically.
  social: [] as { label: string; href: string }[],
} as const;

export const nav = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/services", label: "Services" },
] as const;

export const footerNav = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export const primaryCta = { href: "/contact", label: "Conduct a Hackathon" } as const;

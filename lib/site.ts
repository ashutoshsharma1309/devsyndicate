/**
 * Company details. Every value here is taken from the current public
 * Dev Syndicate website (devsyndicate.co.in) or was supplied directly by the
 * company (the founders and the primary contact). Do not add details that
 * cannot be verified — leave them out instead.
 */
export const site = {
  name: "Dev Syndicate",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.devsyndicate.co.in").replace(/\/$/, ""),
  title: "Dev Syndicate | College Hackathons & Innovation Events",
  description:
    "Dev Syndicate helps colleges plan, promote and conduct professional hackathons, connecting student communities with mentors, judges and industry opportunities.",
  tagline: "Building better hackathons. Connecting campuses with industry.",
  email: "dsdevsyndicate@gmail.com",
  phone: {
    display: "+91 95073 64491",
    href: "tel:+919507364491",
    e164: "+919507364491",
  },
  /** The person enquiries are routed to. Shown wherever the site invites a call. */
  primaryContact: {
    name: "Ashutosh Sharma",
    role: "Co-founder",
    phone: {
      display: "+91 99042 60348",
      href: "tel:+919904260348",
      e164: "+919904260348",
    },
    linkedin: "https://www.linkedin.com/in/ashutoshsharma1309/",
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

/** Founders, as supplied by the company. Names, roles and LinkedIn URLs only — no invented biographies. */
export const team = [
  {
    name: "Shiven Kumar",
    role: "Founder",
    linkedin: "https://www.linkedin.com/in/shiven-kumar-1549b327a/",
  },
  {
    name: "Ashutosh Sharma",
    role: "Co-founder",
    linkedin: "https://www.linkedin.com/in/ashutoshsharma1309/",
    primaryContact: true,
  },
] as const;

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

/**
 * The editable sections: what each one is called in the admin, where its
 * editor lives, and which public pages show it (revalidated on publish).
 * Client-safe: no server imports.
 */
import { DEFAULTS } from "./defaults";
import { resolveContent } from "./merge";
import { schemas, SEO_PATHS, type SectionContent, type SectionKey, type SeoPath } from "./schema";

export type SectionInfo = {
  key: SectionKey;
  label: string;
  /** One line for the admin's content index. */
  summary: string;
  adminHref: string;
  /** Public pages that render this section. */
  publicPaths: string[];
  /** Also shown site-wide (footer, structured data), so publishing revalidates every page. */
  siteWide: boolean;
};

const ALL_PAGES = [...SEO_PATHS];

export const SECTIONS: { readonly [K in SectionKey]: SectionInfo & { key: K } } = {
  homepage: {
    key: "homepage",
    label: "Homepage",
    summary: "Hero, trust strip, section headings, FAQ, closing call to action and footer tagline.",
    adminHref: "/admin/content/homepage",
    // Section headings are shared with /services (formats) and /how-it-works (who does what);
    // the closing call to action is on every marketing page; the tagline is in the footer.
    publicPaths: ["/", "/about", "/how-it-works", "/services"],
    siteWide: true,
  },
  services: {
    key: "services",
    label: "Services",
    summary: "Services page hero, lifecycle stages, formats and partner options.",
    adminHref: "/admin/content/services",
    publicPaths: ["/services", "/"],
    siteWide: false,
  },
  howItWorks: {
    key: "howItWorks",
    label: "How it works",
    summary: "Process steps, what happens after contact, and planning windows.",
    adminHref: "/admin/content/how-it-works",
    publicPaths: ["/how-it-works", "/"],
    siteWide: false,
  },
  team: {
    key: "team",
    label: "Team",
    summary: "Who is shown in the team section and footer, and who is the primary contact.",
    adminHref: "/admin/content/team",
    publicPaths: ["/", "/about"],
    siteWide: true,
  },
  contact: {
    key: "contact",
    label: "Contact details",
    summary: "Company email and phone, primary contact, location and what is shown publicly.",
    adminHref: "/admin/content/contact",
    publicPaths: ALL_PAGES,
    siteWide: true,
  },
  contactForm: {
    key: "contactForm",
    label: "Contact form",
    summary: "Whether the form is open, who is notified, enquiry types and the confirmation message.",
    adminHref: "/admin/content/contact/form",
    publicPaths: ["/contact"],
    siteWide: false,
  },
  seo: {
    key: "seo",
    label: "Search & sharing",
    summary: "Page titles and descriptions for search results and link previews.",
    adminHref: "/admin/content/seo",
    publicPaths: ALL_PAGES,
    siteWide: false,
  },
};

/** Pages whose metadata title is used as is; every other page gets " | Dev Syndicate" appended. */
export const ABSOLUTE_TITLE_PATHS: readonly SeoPath[] = ["/", "/about"];

export const PAGE_LABELS: { readonly [P in SeoPath]: string } = {
  "/": "Home",
  "/about": "About",
  "/how-it-works": "How It Works",
  "/services": "Services",
  "/contact": "Contact",
  "/privacy": "Privacy",
  "/terms": "Terms",
};

/** The preview route accepts these paths only. */
export const PREVIEW_PATHS: readonly string[] = ALL_PAGES;

export const isPreviewPath = (v: unknown): v is string => typeof v === "string" && PREVIEW_PATHS.includes(v);

/** Stored content (or null) → complete, valid content for `key`. A fresh copy: never shares objects with DEFAULTS. */
export function resolveSection<K extends SectionKey>(key: K, stored: unknown): SectionContent<K> {
  return structuredClone(resolveContent(schemas[key], DEFAULTS[key], stored)) as SectionContent<K>;
}

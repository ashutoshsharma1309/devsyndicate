/**
 * Content schemas for every editable section of the public site.
 *
 * Plain text only: strings are trimmed, control and bidi-override characters are
 * stripped, and "<" / ">" are rejected, so nothing an editor types can become
 * markup. Links are limited to internal paths, https://, mailto: and tel:.
 *
 * Pure and client-safe (zod/mini only, no server imports), so the admin editors
 * can validate in the browser with exactly the rules the server enforces.
 * Node's test runner imports this file directly, so it has no value imports
 * besides zod.
 */
import * as z from "zod/mini";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

// C0 controls except \t \n \r, DEL, C1 controls, and bidi embedding/override/isolate characters.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F‪-‮⁦-⁩]/g;

/** Strips control characters. Single-line text also folds tabs, line breaks and repeated spaces into one space. */
export function cleanText(v: string, multiline = false): string {
  const stripped = v.replace(CONTROL, "");
  const folded = multiline
    ? stripped.replace(/\r\n?/g, "\n").replace(/\t/g, " ").replace(/\n{3,}/g, "\n\n")
    : stripped.replace(/[\t\r\n]+/g, " ").replace(/ {2,}/g, " ");
  return folded.trim();
}

const NO_MARKUP = "Use plain text: “<” and “>” aren't allowed.";
const noMarkup = (v: string) => !/[<>]/.test(v);

type TextOpts = { min?: number; multiline?: boolean; label?: string };

/** Required plain text (at least one character unless `min: 0`). */
export function text(max: number, { min = 1, multiline = false, label = "This field" }: TextOpts = {}) {
  return z
    .pipe(
      z.string(`${label} must be text.`),
      z.transform((v) => cleanText(v, multiline)),
    )
    .check(
      z.minLength(min, min <= 1 ? `${label} can't be empty.` : `${label} needs at least ${min} characters.`),
      z.maxLength(max, `Keep this under ${max} characters.`),
      z.refine(noMarkup, NO_MARKUP),
    );
}

/** Optional plain text: empty string when left blank. */
export const optionalText = (max: number, multiline = false) => text(max, { min: 0, multiline });

const EMAIL = /^[^\s@<>()[\]\\,;:"']+@[^\s@<>()[\]\\,;:"']+\.[A-Za-z]{2,}$/;
export const isEmail = (v: string) => v.length <= 200 && EMAIL.test(v);

export const email = () =>
  z
    .pipe(
      z.string("Enter an email address."),
      z.transform((v) => cleanText(v).toLowerCase()),
    )
    .check(z.refine(isEmail, "Enter a valid email address, e.g. team@example.com"));

/** Email, or "" for "not set". */
export const optionalEmail = () =>
  z
    .pipe(
      z.string("Enter an email address."),
      z.transform((v) => cleanText(v).toLowerCase()),
    )
    .check(z.refine((v) => v === "" || isEmail(v), "Enter a valid email address, or leave this empty."));

/**
 * A path on this site: starts with one "/", no "//" or backslash (browsers read
 * "/\\host" as another origin), no spaces or quotes. Query and hash are allowed.
 */
export function isInternalPath(v: string): boolean {
  if (v.length > 300 || !v.startsWith("/") || v.startsWith("//") || /[\s\\"'<>`]/.test(v)) return false;
  try {
    const base = "http://site.invalid";
    const url = new URL(v, base);
    return url.origin === base && !url.pathname.includes("//");
  } catch {
    return false;
  }
}

const E164 = /^\+[1-9]\d{7,14}$/;
export const isE164 = (v: string) => E164.test(v);

/** https:// with a real host name and no embedded credentials. */
export function isHttpsUrl(v: string): boolean {
  if (v.length > 500 || !/^https:\/\//i.test(v) || /[\s\\"'<>`]/.test(v)) return false;
  try {
    const url = new URL(v);
    return url.protocol === "https:" && !url.username && !url.password && /\.[a-z]{2,}$/i.test(url.hostname);
  } catch {
    return false;
  }
}

/** Internal path, https://…, mailto:<address> or tel:<E.164>. Nothing else (no javascript:, data:, http:). */
export function isSafeLink(v: string): boolean {
  if (v.startsWith("/")) return isInternalPath(v);
  if (/^mailto:/i.test(v)) return isEmail(v.slice(7));
  if (/^tel:/i.test(v)) return isE164(v.slice(4));
  return isHttpsUrl(v);
}

const LINK_MESSAGE = "Use a path on this site (/contact), an https:// link, mailto:address or tel:+91…";

export const link = () =>
  z
    .pipe(
      z.string("Enter a link."),
      z.transform((v) => cleanText(v)),
    )
    .check(z.minLength(1, "Enter a link."), z.refine(isSafeLink, LINK_MESSAGE));

export const internalPath = () =>
  z
    .pipe(
      z.string("Enter a path."),
      z.transform((v) => cleanText(v)),
    )
    .check(z.refine(isInternalPath, "Use a path on this site, e.g. /privacy"));

const LINKEDIN = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9%_-]{2,100}\/?$/;
export const isLinkedInProfile = (v: string) => LINKEDIN.test(v);

export const linkedin = () =>
  z
    .pipe(
      z.string("Enter a LinkedIn profile URL."),
      z.transform((v) => cleanText(v)),
    )
    .check(z.refine(isLinkedInProfile, "Use a LinkedIn profile URL, e.g. https://www.linkedin.com/in/name/"));

const digits = (v: string) => v.replace(/\D/g, "");

/** A phone number as shown ("+91 95073 64491") and as dialled (E.164). The two must be the same number. */
export const phone = () =>
  z
    .object({
      display: text(24, { label: "Phone number" }).check(
        z.refine((v) => /^\+?[\d\s()-]+$/.test(v), "Use digits, spaces, +, - and brackets only."),
      ),
      e164: z
        .pipe(z.string("Enter the number in E.164 form."), z.transform((v) => cleanText(v).replace(/[\s()-]/g, "")))
        .check(z.refine(isE164, "Use international format with no spaces, e.g. +919507364491")),
    })
    .check(
      z.superRefine((p, ctx) => {
        if (isE164(p.e164) && digits(p.display) !== digits(p.e164)) {
          ctx.addIssue({
            code: "custom",
            path: ["display"],
            message: "The displayed number must match the E.164 number.",
            input: p.display,
          });
        }
      }),
    );

const list = <T extends z.ZodMiniType>(item: T, min: number, max: number, what: string) =>
  z.array(item).check(
    z.minLength(min, min === 1 ? `Add at least one ${what}.` : `Add at least ${min} ${what}s.`),
    z.maxLength(max, `Keep this to ${max} ${what}s or fewer.`),
  );

const cta = () => z.object({ label: text(40, { label: "Button label" }), href: link() });

/** A section's eyebrow label, heading and supporting paragraph. */
const intro = (descriptionMin = 1) =>
  z.object({
    label: text(60, { label: "Label" }),
    heading: text(160, { label: "Heading" }),
    description: text(600, { min: descriptionMin, label: "Description" }),
  });

const titleBody = () => z.object({ title: text(120, { label: "Title" }), body: text(600, { label: "Text" }) });

// ---------------------------------------------------------------------------
// Fixed vocabularies
// ---------------------------------------------------------------------------

export const PHASES = ["Plan", "Build-up", "Live", "After"] as const;
export type Phase = (typeof PHASES)[number];

/** Format codes are fixed: /contact?format=<code> and the format glyphs depend on them. */
export const FORMAT_CODES = ["CAMPUS", "NATIONAL", "INDUSTRY", "INNOVATION", "CUSTOM"] as const;
export type FormatCode = (typeof FORMAT_CODES)[number];

/**
 * Enquiry types the contact form can offer. Must equal the values of `eventTypes`
 * in lib/validation/lead.ts (tests/cms.test.ts checks this).
 */
export const ENQUIRY_TYPES = ["campus", "national", "industry", "sponsorship", "general"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

/** Public pages with editable SEO. */
export const SEO_PATHS = ["/", "/about", "/how-it-works", "/services", "/contact", "/privacy", "/terms"] as const;
export type SeoPath = (typeof SEO_PATHS)[number];

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export const homepageSchema = z.object({
  hero: z.object({
    eyebrow: text(80, { label: "Eyebrow" }),
    /** Three display lines, rendered one under the other. */
    headline: z.tuple([text(40, { label: "Line 1" }), text(40, { label: "Line 2" }), text(40, { label: "Line 3" })]),
    lead: text(400, { label: "Lead" }),
    primaryCta: cta(),
    secondaryCta: cta(),
  }),
  trust: z.object({
    line: text(160, { label: "Trust line" }),
    points: list(text(40, { label: "Trust point" }), 1, 8, "trust point"),
  }),
  sections: z.object({
    problem: intro(),
    whatWeDo: intro(),
    why: intro(),
    formats: intro(),
    ecosystem: intro(),
    howItWorks: intro(),
    responsibilities: intro(),
    experience: intro(),
    outcomes: intro(),
    /** Has no paragraph today, so the description may stay empty. */
    expectations: intro(0),
    faq: z.object({ label: text(60, { label: "Label" }), heading: text(160, { label: "Heading" }) }),
  }),
  faq: z.object({
    items: list(z.object({ q: text(200, { label: "Question" }), a: text(1200, { label: "Answer" }) }), 1, 30, "question"),
  }),
  finalCta: z.object({ title: text(160, { label: "Title" }), body: text(400, { label: "Text" }) }),
  footer: z.object({ tagline: text(160, { label: "Tagline" }) }),
});

const stageSchema = z.object({
  n: text(3, { label: "Number" }).check(z.refine((v) => /^\d{1,3}$/.test(v), "Use digits, e.g. 01")),
  title: text(60, { label: "Title" }),
  phase: z.enum(PHASES, "Choose a phase."),
  body: text(400, { label: "Description" }),
  deliverables: list(text(60, { label: "Deliverable" }), 1, 8, "deliverable"),
  visible: z.boolean("Choose whether the stage is shown."),
});

const formatSchema = z.object({
  code: z.enum(FORMAT_CODES, "Unknown format."),
  title: text(60, { label: "Title" }),
  summary: text(200, { label: "Summary" }),
  scope: text(200, { label: "Who takes part" }),
  goodFor: text(300, { label: "Good for" }),
  visible: z.boolean("Choose whether the format is shown."),
});

export const servicesSchema = z.object({
  hero: z.object({
    eyebrow: text(80, { label: "Eyebrow" }),
    title: text(160, { label: "Title" }),
    lead: text(400, { label: "Lead" }),
    primaryCta: cta(),
    secondaryCta: cta(),
  }),
  stagesIntro: intro(),
  phaseIntros: z.object({
    Plan: text(200, { label: "Plan" }),
    "Build-up": text(200, { label: "Build-up" }),
    Live: text(200, { label: "Live" }),
    After: text(200, { label: "After" }),
  }),
  stages: list(stageSchema, 1, 12, "stage"),
  formats: z.array(formatSchema).check(
    z.superRefine((formats, ctx) => {
      const codes = formats.map((f) => f.code);
      const missing = FORMAT_CODES.filter((c) => !codes.includes(c));
      if (formats.length !== FORMAT_CODES.length || missing.length > 0 || new Set(codes).size !== codes.length) {
        ctx.addIssue({
          code: "custom",
          message: `Formats can be reordered or hidden, not added or removed (${FORMAT_CODES.join(", ")}).`,
          input: formats,
        });
      }
    }),
  ),
  partners: z.object({
    label: text(60, { label: "Label" }),
    heading: text(160, { label: "Heading" }),
    description: text(600, { label: "Description" }),
    cta: cta(),
    options: list(titleBody(), 1, 8, "option"),
  }),
});

export const howItWorksSchema = z.object({
  hero: z.object({
    eyebrow: text(80, { label: "Eyebrow" }),
    title: text(160, { label: "Title" }),
    lead: text(400, { label: "Lead" }),
    facts: list(z.object({ label: text(40, { label: "Label" }), value: text(60, { label: "Value" }) }), 0, 6, "fact"),
  }),
  stepsIntro: intro(),
  steps: list(
    z.object({
      title: text(120, { label: "Title" }),
      body: text(400, { label: "Description" }),
      fromYou: text(300, { label: "From your college" }),
      fromUs: text(300, { label: "From Dev Syndicate" }),
    }),
    1,
    10,
    "step",
  ),
  afterContact: z.object({
    label: text(60, { label: "Label" }),
    heading: text(160, { label: "Heading" }),
    description: text(600, { label: "Description" }),
    cta: cta(),
    steps: list(titleBody(), 1, 8, "step"),
  }),
  timing: z.object({
    label: text(60, { label: "Label" }),
    heading: text(160, { label: "Heading" }),
    description: text(600, { label: "Description" }),
    windows: list(
      z.object({
        label: text(60, { label: "Label" }),
        weeks: text(12, { label: "Weeks" }),
        body: text(300, { label: "Description" }),
      }),
      1,
      4,
      "planning window",
    ),
  }),
});

const memberSchema = z.object({
  name: text(80, { label: "Name" }),
  role: text(60, { label: "Role" }),
  /** Optional. Supplied by the person themselves; never written for them. */
  bio: optionalText(400, true),
  linkedin: linkedin(),
  visible: z.boolean("Choose whether this person is shown."),
  primaryContact: z.boolean("Choose whether this person is the primary contact."),
});

export const teamSchema = z.object({
  label: text(60, { label: "Label" }),
  heading: text(160, { label: "Heading" }),
  lead: text(600, { label: "Lead" }),
  members: list(memberSchema, 1, 12, "team member").check(
    z.superRefine((members, ctx) => {
      if (members.filter((m) => m.primaryContact).length > 1) {
        ctx.addIssue({ code: "custom", message: "Only one person can be the primary contact.", input: members });
      }
    }),
  ),
});

export const contactSchema = z.object({
  email: email(),
  phone: phone(),
  primaryContact: z.object({
    name: text(80, { label: "Name" }),
    role: text(60, { label: "Role" }),
    phone: phone(),
    linkedin: linkedin(),
  }),
  location: z.object({
    city: text(60, { label: "City" }),
    region: text(60, { label: "Region" }),
    country: text(60, { label: "Country" }),
  }),
  visibility: z.object({
    /** The company phone line in the footer and on /about. */
    showCompanyPhone: z.boolean(),
    /** The primary contact's LinkedIn link (contact options, final CTA). */
    showPrimaryContactLinkedin: z.boolean(),
  }),
});

export const contactFormSchema = z.object({
  enabled: z.boolean("Choose whether the form accepts enquiries."),
  /** Where lead notifications go. "" = CONTACT_EMAIL, else the company email. Changing it needs the current password. */
  notificationRecipient: optionalEmail(),
  confirmationMessage: text(600, { multiline: true, label: "Confirmation message" }),
  enabledEnquiryTypes: z
    .array(z.enum(ENQUIRY_TYPES, "Unknown enquiry type."))
    .check(
      z.minLength(1, "Keep at least one enquiry type."),
      z.refine((v) => new Set(v).size === v.length, "Each enquiry type can only be listed once."),
    ),
  privacyHref: internalPath(),
});

const seoPage = z.object({
  title: text(90, { label: "Title" }),
  description: text(300, { label: "Description" }),
  /** Empty = same as the title. */
  ogTitle: optionalText(90),
  /** Empty = same as the description. */
  ogDescription: optionalText(300),
});

export const seoSchema = z.object({
  pages: z.object({
    "/": seoPage,
    "/about": seoPage,
    "/how-it-works": seoPage,
    "/services": seoPage,
    "/contact": seoPage,
    "/privacy": seoPage,
    "/terms": seoPage,
  }),
});

export const schemas = {
  homepage: homepageSchema,
  services: servicesSchema,
  howItWorks: howItWorksSchema,
  team: teamSchema,
  contact: contactSchema,
  contactForm: contactFormSchema,
  seo: seoSchema,
} as const;

export type SectionKey = keyof typeof schemas;
export const SECTION_KEYS = Object.keys(schemas) as SectionKey[];
export const isSectionKey = (v: unknown): v is SectionKey => typeof v === "string" && Object.hasOwn(schemas, v);

export type HomepageContent = z.output<typeof homepageSchema>;
export type ServicesContent = z.output<typeof servicesSchema>;
export type HowItWorksContent = z.output<typeof howItWorksSchema>;
export type TeamContent = z.output<typeof teamSchema>;
export type TeamMember = TeamContent["members"][number];
export type ContactContent = z.output<typeof contactSchema>;
export type ContactFormContent = z.output<typeof contactFormSchema>;
export type SeoContent = z.output<typeof seoSchema>;
export type SeoPage = SeoContent["pages"][SeoPath];
export type LifecycleStage = ServicesContent["stages"][number];
export type FormatEntry = ServicesContent["formats"][number];

export type SectionContent<K extends SectionKey> = z.output<(typeof schemas)[K]>;
export type AnySectionContent = { [K in SectionKey]: SectionContent<K> }[SectionKey];

/** Zod issues → `{ "hero.headline.0": "message" }`, first message per path. "" is the section itself. */
export function contentFieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

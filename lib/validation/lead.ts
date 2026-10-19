/**
 * The hackathon request form schema. Shared by the contact form (client-side
 * inline validation) and the API route (authoritative validation), so the two
 * can never disagree. Uses `zod/mini` to keep the client bundle small.
 */
import * as z from "zod/mini";

/** Enquiry types offered on the form. */
export const eventTypes = [
  { value: "campus", label: "Campus Hackathon" },
  { value: "national", label: "National Hackathon" },
  { value: "industry", label: "Industry Challenge" },
  { value: "sponsorship", label: "Sponsorship or Partnership" },
  { value: "general", label: "General Enquiry" },
] as const;

/**
 * Every enquiry type the API accepts and the admin can label: the current
 * options plus ones offered by earlier versions of the form, so stored leads
 * keep their labels and filters.
 */
export const allEventTypes = [
  ...eventTypes,
  { value: "innovation", label: "Innovation Challenge" },
  { value: "custom", label: "Custom format" },
  { value: "unsure", label: "Not sure yet" },
] as const;

export const participantRanges = [
  { value: "lt100", label: "Under 100" },
  { value: "100-300", label: "100 – 300" },
  { value: "300-750", label: "300 – 750" },
  { value: "750-1500", label: "750 – 1,500" },
  { value: "1500+", label: "1,500+" },
  { value: "unsure", label: "Not sure yet" },
] as const;

export const eventFormats = [
  { value: "offline", label: "Offline", hint: "On campus" },
  { value: "online", label: "Online", hint: "Fully remote" },
  { value: "hybrid", label: "Hybrid", hint: "Both" },
] as const;

export const timelines = [
  { value: "lt1m", label: "Within a month" },
  { value: "1-3m", label: "1 – 3 months" },
  { value: "3-6m", label: "3 – 6 months" },
  { value: "6m+", label: "More than 6 months" },
  { value: "undecided", label: "Not decided yet" },
] as const;

export const indianStates = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Outside India",
] as const;

type Option = { readonly value: string; readonly label: string };
const values = <T extends readonly Option[]>(opts: T) => opts.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

/** Display label for a stored option value. Empty (an optional field left blank) reads as "—". */
export function labelFor(opts: readonly Option[], value: string) {
  return opts.find((o) => o.value === value)?.label ?? (value || "—");
}

// Strip control characters (keeps newlines and tabs) before anything is stored or emailed.
const clean = (v: string) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

const text = (min: number, max: number, required: string) =>
  z.pipe(
    z.string(required),
    z.transform((v) => clean(v).trim()),
  ).check(z.minLength(min, required), z.maxLength(max, `Keep this under ${max} characters.`));

const optionalText = (max: number) =>
  z.pipe(
    z.optional(z.string()),
    z.transform((v) => clean(v ?? "").trim()),
  ).check(z.maxLength(max, `Keep this under ${max} characters.`));

/** An optional select or radio group: one of `vals`, or "" when left blank. */
const optionalChoice = <T extends readonly [string, ...string[]]>(vals: T, message: string) =>
  z._default(z.union([z.literal(""), z.enum(vals)], message), "");

const phoneDigits = (v: string) => v.replace(/\D/g, "");

// Required: name, institution, email, phone and enquiry type. Everything else is
// optional so the form stays short. City, state, website and theme are kept
// (optional) for API compatibility and for leads stored by earlier versions.
export const leadSchema = z.object({
  name: text(2, 120, "Enter your full name."),
  institution: text(2, 160, "Enter your college or institution name."),
  email: z.pipe(
    z.string("Enter your work or institutional email."),
    z.transform((v) => v.trim().toLowerCase()),
  ).check(z.email("Enter a valid email address, e.g. name@college.edu.in"), z.maxLength(200, "Keep this under 200 characters.")),
  phone: text(1, 24, "Enter a phone number.").check(
    z.refine((v) => /^[+\d][\d\s()-]*$/.test(v) && phoneDigits(v).length >= 10 && phoneDigits(v).length <= 15, {
      message: "Enter a valid phone number, e.g. +91 98765 43210",
    }),
  ),
  eventType: z.enum(values(allEventTypes), "Choose what your enquiry is about."),

  designation: optionalText(120),
  city: optionalText(80),
  state: optionalChoice(indianStates, "Select a state."),
  website: z.pipe(
    optionalText(200),
    z.transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v)),
  ).check(
    z.refine((v) => v === "" || (URL.canParse(v) && /\.[a-z]{2,}/i.test(new URL(v).hostname)), {
      message: "Enter a valid website, e.g. www.yourcollege.edu.in",
    }),
  ),
  participants: optionalChoice(values(participantRanges), "Choose an expected participant range."),
  format: optionalChoice(values(eventFormats), "Choose a preferred format."),
  timeline: optionalChoice(values(timelines), "Choose a preferred timeline."),
  theme: optionalText(200),
  message: optionalText(3000),
});

export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;
export type LeadField = keyof LeadData;

/** Fields the API expects alongside the lead itself — used only for spam checks. */
export const spamFields = {
  /**
   * Honeypot. Hidden from people; bots fill it in. Deliberately meaningless:
   * a name like "company_url" gets filled by browser autofill, which would
   * silently discard real enquiries.
   */
  honeypot: "hp_x7k",
  /**
   * Milliseconds between the form mounting and submit, measured on the
   * visitor's monotonic clock (performance.now()). An elapsed time, not a
   * timestamp, so a visitor whose system clock is wrong isn't rejected.
   */
  fillMs: "fill_ms",
} as const;

/** Minimum time a real person needs to fill in the form. */
export const MIN_FILL_MS = 4000;

/** Flattens zod issues into `{ field: firstMessage }`. */
export function fieldErrors(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const out: Partial<Record<LeadField, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0] as LeadField | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

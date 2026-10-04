/**
 * The hackathon request form schema. Shared by the contact form (client-side
 * inline validation) and the API route (authoritative validation), so the two
 * can never disagree. Uses `zod/mini` to keep the client bundle small.
 */
import * as z from "zod/mini";

export const eventTypes = [
  { value: "campus", label: "Campus Hackathon" },
  { value: "national", label: "National Hackathon" },
  { value: "industry", label: "Industry Challenge" },
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

export function labelFor(opts: readonly Option[], value: string) {
  return opts.find((o) => o.value === value)?.label ?? value;
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

const phoneDigits = (v: string) => v.replace(/\D/g, "");

export const leadSchema = z.object({
  institution: text(2, 160, "Enter your college or institution name."),
  city: text(2, 80, "Enter the city."),
  state: z.enum(indianStates, "Select a state."),
  website: z.pipe(
    optionalText(200),
    z.transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v)),
  ).check(
    z.refine((v) => v === "" || (URL.canParse(v) && /\.[a-z]{2,}/i.test(new URL(v).hostname)), {
      message: "Enter a valid website, e.g. www.yourcollege.edu.in",
    }),
  ),

  name: text(2, 120, "Enter your name."),
  designation: text(2, 120, "Enter your designation."),
  email: z.pipe(
    z.string("Enter your official email."),
    z.transform((v) => v.trim().toLowerCase()),
  ).check(z.email("Enter a valid email address."), z.maxLength(200, "Keep this under 200 characters.")),
  phone: text(1, 24, "Enter a phone number.").check(
    z.refine((v) => /^[+\d][\d\s()-]*$/.test(v) && phoneDigits(v).length >= 10 && phoneDigits(v).length <= 15, {
      message: "Enter a valid phone number, e.g. +91 98765 43210",
    }),
  ),

  eventType: z.enum(values(eventTypes), "Choose the kind of event you have in mind."),
  participants: z.enum(values(participantRanges), "Choose an expected participant range."),
  format: z.enum(values(eventFormats), "Choose a preferred format."),
  timeline: z.enum(values(timelines), "Choose a preferred timeline."),
  theme: optionalText(200),
  message: optionalText(3000),
});

export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;
export type LeadField = keyof LeadData;

/** Fields the API expects alongside the lead itself — used only for spam checks. */
export const spamFields = {
  /** Honeypot. Hidden from people; bots fill it in. */
  honeypot: "company_url",
  /** Epoch ms when the form was first rendered. */
  startedAt: "started_at",
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
